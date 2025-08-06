const express = require('express');
const { body, validationResult } = require('express-validator');
const Candidate = require('../models/Candidate');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all candidates
router.get('/', async (req, res) => {
  try {
    const { position = '', search = '', page = 1, limit = 10 } = req.query;
    
    const query = { isActive: true };
    if (position) query.position = position;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { party: { $regex: search, $options: 'i' } }
      ];
    }

    const candidates = await Candidate.find(query)
      .populate('createdBy', 'username')
      .sort({ voteCount: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Candidate.countDocuments(query);

    res.json({
      candidates,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get candidate by ID
router.get('/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('createdBy', 'username');
    
    if (!candidate || !candidate.isActive) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json({ candidate });
  } catch (error) {
    console.error('Get candidate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new candidate (admin only)
router.post('/', adminAuth, [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('position')
    .isLength({ min: 2, max: 100 })
    .withMessage('Position must be between 2 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('party')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Party must be less than 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, description, image, party, position } = req.body;

    const candidate = new Candidate({
      name,
      description,
      image,
      party,
      position,
      createdBy: req.user._id
    });

    await candidate.save();
    await candidate.populate('createdBy', 'username');

    res.status(201).json({
      message: 'Candidate created successfully',
      candidate
    });
  } catch (error) {
    console.error('Create candidate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update candidate (admin only)
router.put('/:id', adminAuth, [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('position')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Position must be between 2 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('party')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Party must be less than 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, description, image, party, position, isActive } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (image !== undefined) updates.image = image;
    if (party !== undefined) updates.party = party;
    if (position !== undefined) updates.position = position;
    if (isActive !== undefined) updates.isActive = isActive;

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username');

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json({
      message: 'Candidate updated successfully',
      candidate
    });
  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete candidate (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get positions
router.get('/positions/list', async (req, res) => {
  try {
    const positions = await Candidate.distinct('position', { isActive: true });
    res.json({ positions });
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get candidate statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalCandidates = await Candidate.countDocuments({ isActive: true });
    const totalVotes = await Candidate.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$voteCount' } } }
    ]);
    
    const topCandidates = await Candidate.find({ isActive: true })
      .sort({ voteCount: -1 })
      .limit(5)
      .select('name voteCount position');

    res.json({
      totalCandidates,
      totalVotes: totalVotes[0]?.total || 0,
      topCandidates
    });
  } catch (error) {
    console.error('Candidate stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 