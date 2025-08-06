const express = require('express');
const { body, validationResult } = require('express-validator');
const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Submit a vote
router.post('/', auth, [
  body('candidateId')
    .isMongoId()
    .withMessage('Invalid candidate ID'),
  body('position')
    .notEmpty()
    .withMessage('Position is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { candidateId, position } = req.body;

    // Check if candidate exists and is active
    const candidate = await Candidate.findById(candidateId);
    if (!candidate || !candidate.isActive) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Check if user has already voted for this position
    const existingVote = await Vote.findOne({
      voter: req.user._id,
      position: position
    });

    if (existingVote) {
      return res.status(400).json({ 
        message: 'You have already voted for this position' 
      });
    }

    // Create new vote
    const vote = new Vote({
      voter: req.user._id,
      candidate: candidateId,
      position: position,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await vote.save();

    // Update candidate vote count
    candidate.voteCount += 1;
    await candidate.save();

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    io.to(`vote-${position}`).emit('vote-updated', {
      position: position,
      candidateId: candidateId,
      voteCount: candidate.voteCount,
      totalVotes: await Vote.countDocuments({ position: position })
    });

    res.status(201).json({
      message: 'Vote submitted successfully',
      vote: {
        id: vote._id,
        candidate: candidateId,
        position: position,
        timestamp: vote.createdAt
      }
    });
  } catch (error) {
    console.error('Submit vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get voting results for a position
router.get('/results/:position', async (req, res) => {
  try {
    const { position } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Get candidates for this position with vote counts
    const candidates = await Candidate.find({
      position: position,
      isActive: true
    }).sort({ voteCount: -1 });

    // Get total votes for this position
    const totalVotes = await Vote.countDocuments({ position: position });

    // Calculate percentages
    const results = candidates.map(candidate => ({
      id: candidate._id,
      name: candidate.name,
      party: candidate.party,
      description: candidate.description,
      image: candidate.image,
      voteCount: candidate.voteCount,
      percentage: totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(2) : 0
    }));

    res.json({
      position: position,
      results: results,
      totalVotes: totalVotes,
      totalCandidates: candidates.length
    });
  } catch (error) {
    console.error('Get voting results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's voting history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const votes = await Vote.find({ voter: req.user._id })
      .populate('candidate', 'name position party')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Vote.countDocuments({ voter: req.user._id });

    res.json({
      votes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get voting history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get overall voting statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalVotes = await Vote.countDocuments();
    const totalPositions = await Vote.distinct('position').count();
    const recentVotes = await Vote.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    // Get top positions by vote count
    const topPositions = await Vote.aggregate([
      {
        $group: {
          _id: '$position',
          voteCount: { $sum: 1 }
        }
      },
      { $sort: { voteCount: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalVotes,
      totalPositions,
      recentVotes,
      topPositions
    });
  } catch (error) {
    console.error('Voting stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get voting statistics for admin
router.get('/stats/admin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { startDate, endDate } = req.query;
    const dateFilter = {};

    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const totalVotes = await Vote.countDocuments(dateFilter);
    const validVotes = await Vote.countDocuments({ ...dateFilter, isValid: true });
    const invalidVotes = await Vote.countDocuments({ ...dateFilter, isValid: false });

    // Get votes by position
    const votesByPosition = await Vote.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$position',
          voteCount: { $sum: 1 }
        }
      },
      { $sort: { voteCount: -1 } }
    ]);

    // Get daily voting trends
    const dailyVotes = await Vote.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          voteCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalVotes,
      validVotes,
      invalidVotes,
      votesByPosition,
      dailyVotes
    });
  } catch (error) {
    console.error('Admin voting stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Invalidate a vote (admin only)
router.put('/:id/invalidate', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const vote = await Vote.findById(req.params.id);
    if (!vote) {
      return res.status(404).json({ message: 'Vote not found' });
    }

    vote.isValid = false;
    await vote.save();

    // Update candidate vote count
    const candidate = await Candidate.findById(vote.candidate);
    if (candidate) {
      candidate.voteCount = Math.max(0, candidate.voteCount - 1);
      await candidate.save();
    }

    res.json({ message: 'Vote invalidated successfully' });
  } catch (error) {
    console.error('Invalidate vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 