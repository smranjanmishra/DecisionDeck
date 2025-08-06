const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');
const User = require('../models/User');

const router = express.Router();

// Get real-time voting analytics dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get voting trends by hour/day
    const votingTrends = await Vote.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: timeRange === '24h' ? '%Y-%m-%d-%H' : '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top performing candidates
    const topCandidates = await Candidate.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $lookup: {
          from: 'votes',
          localField: '_id',
          foreignField: 'candidate',
          pipeline: [
            {
              $match: {
                createdAt: { $gte: startDate }
              }
            }
          ],
          as: 'recentVotes'
        }
      },
      {
        $addFields: {
          recentVoteCount: { $size: '$recentVotes' }
        }
      },
      {
        $sort: { recentVoteCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          name: 1,
          position: 1,
          party: 1,
          totalVoteCount: '$voteCount',
          recentVoteCount: 1
        }
      }
    ]);

    // Get position-wise analytics
    const positionAnalytics = await Vote.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$position',
          totalVotes: { $sum: 1 },
          uniqueVoters: { $addToSet: '$voter' }
        }
      },
      {
        $addFields: {
          uniqueVoterCount: { $size: '$uniqueVoters' }
        }
      },
      {
        $sort: { totalVotes: -1 }
      }
    ]);

    // Get user engagement metrics
    const userEngagement = await Vote.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$voter',
          voteCount: { $sum: 1 },
          positions: { $addToSet: '$position' }
        }
      },
      {
        $addFields: {
          uniquePositions: { $size: '$positions' }
        }
      },
      {
        $group: {
          _id: null,
          totalVoters: { $sum: 1 },
          avgVotesPerUser: { $avg: '$voteCount' },
          avgPositionsPerUser: { $avg: '$uniquePositions' },
          maxVotesByUser: { $max: '$voteCount' }
        }
      }
    ]);

    // Get hourly activity pattern
    const hourlyPattern = await Vote.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate conversion rate (votes vs total users)
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalVotesInPeriod = await Vote.countDocuments({
      createdAt: { $gte: startDate }
    });

    const analytics = {
      timeRange,
      period: {
        start: startDate,
        end: now
      },
      overview: {
        totalVotes: totalVotesInPeriod,
        totalUsers,
        conversionRate: totalUsers > 0 ? ((totalVotesInPeriod / totalUsers) * 100).toFixed(2) : 0,
        averageVotesPerUser: userEngagement[0]?.avgVotesPerUser || 0
      },
      trends: {
        votingTrends,
        hourlyPattern
      },
      performance: {
        topCandidates,
        positionAnalytics
      },
      engagement: userEngagement[0] || {
        totalVoters: 0,
        avgVotesPerUser: 0,
        avgPositionsPerUser: 0,
        maxVotesByUser: 0
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Get detailed candidate performance analytics
router.get('/candidates/:candidateId', auth, async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { timeRange = '30d' } = req.query;

    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Get vote history over time
    const voteHistory = await Vote.aggregate([
      {
        $match: {
          candidate: candidate._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          votes: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get voter demographics (if admin)
    let voterDemographics = null;
    if (req.user.role === 'admin') {
      voterDemographics = await Vote.aggregate([
        {
          $match: {
            candidate: candidate._id,
            createdAt: { $gte: startDate }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'voter',
            foreignField: '_id',
            as: 'voterInfo'
          }
        },
        {
          $unwind: '$voterInfo'
        },
        {
          $group: {
            _id: '$voterInfo.role',
            count: { $sum: 1 }
          }
        }
      ]);
    }

    // Get position comparison
    const positionComparison = await Vote.aggregate([
      {
        $match: {
          position: candidate.position,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$candidate',
          voteCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'candidates',
          localField: '_id',
          foreignField: '_id',
          as: 'candidateInfo'
        }
      },
      {
        $unwind: '$candidateInfo'
      },
      {
        $sort: { voteCount: -1 }
      }
    ]);

    const analytics = {
      candidate: {
        id: candidate._id,
        name: candidate.name,
        position: candidate.position,
        party: candidate.party
      },
      performance: {
        totalVotes: candidate.voteCount,
        recentVotes: voteHistory.reduce((sum, day) => sum + day.votes, 0),
        voteHistory,
        positionRank: positionComparison.findIndex(c => c._id.toString() === candidateId) + 1,
        totalCandidatesInPosition: positionComparison.length
      },
      comparison: positionComparison,
      demographics: voterDemographics
    };

    res.json(analytics);
  } catch (error) {
    console.error('Candidate analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch candidate analytics' });
  }
});

// Get position analytics
router.get('/positions/:position', auth, async (req, res) => {
  try {
    const { position } = req.params;
    const { timeRange = '30d' } = req.query;

    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all candidates for this position
    const candidates = await Candidate.find({
      position: position,
      isActive: true
    });

    // Get detailed vote analytics for each candidate
    const candidateAnalytics = await Promise.all(
      candidates.map(async (candidate) => {
        const votes = await Vote.find({
          candidate: candidate._id,
          createdAt: { $gte: startDate }
        });

        const voteTrend = await Vote.aggregate([
          {
            $match: {
              candidate: candidate._id,
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              votes: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);

        return {
          id: candidate._id,
          name: candidate.name,
          party: candidate.party,
          totalVotes: candidate.voteCount,
          recentVotes: votes.length,
          voteTrend,
          percentage: 0 // Will be calculated below
        };
      })
    );

    // Calculate percentages
    const totalVotes = candidateAnalytics.reduce((sum, candidate) => sum + candidate.recentVotes, 0);
    candidateAnalytics.forEach(candidate => {
      candidate.percentage = totalVotes > 0 ? ((candidate.recentVotes / totalVotes) * 100).toFixed(2) : 0;
    });

    // Sort by recent votes
    candidateAnalytics.sort((a, b) => b.recentVotes - a.recentVotes);

    // Get overall position trends
    const positionTrends = await Vote.aggregate([
      {
        $match: {
          position: position,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          votes: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const analytics = {
      position,
      period: {
        start: startDate,
        end: now
      },
      overview: {
        totalCandidates: candidates.length,
        totalVotes: totalVotes,
        averageVotesPerCandidate: candidates.length > 0 ? (totalVotes / candidates.length).toFixed(2) : 0
      },
      candidates: candidateAnalytics,
      trends: positionTrends
    };

    res.json(analytics);
  } catch (error) {
    console.error('Position analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch position analytics' });
  }
});

// Get user voting behavior analytics (admin only)
router.get('/users/behavior', adminAuth, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get user voting patterns
    const userBehavior = await Vote.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$voter',
          totalVotes: { $sum: 1 },
          positions: { $addToSet: '$position' },
          candidates: { $addToSet: '$candidate' },
          firstVote: { $min: '$createdAt' },
          lastVote: { $max: '$createdAt' }
        }
      },
      {
        $addFields: {
          uniquePositions: { $size: '$positions' },
          uniqueCandidates: { $size: '$candidates' },
          votingSpan: {
            $divide: [
              { $subtract: ['$lastVote', '$firstVote'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          userId: '$_id',
          username: '$userInfo.username',
          email: '$userInfo.email',
          role: '$userInfo.role',
          totalVotes: 1,
          uniquePositions: 1,
          uniqueCandidates: 1,
          votingSpan: 1,
          firstVote: 1,
          lastVote: 1
        }
      },
      {
        $sort: { totalVotes: -1 }
      }
    ]);

    // Calculate engagement metrics
    const engagementMetrics = {
      totalVoters: userBehavior.length,
      averageVotesPerUser: userBehavior.length > 0 
        ? (userBehavior.reduce((sum, user) => sum + user.totalVotes, 0) / userBehavior.length).toFixed(2)
        : 0,
      averagePositionsPerUser: userBehavior.length > 0
        ? (userBehavior.reduce((sum, user) => sum + user.uniquePositions, 0) / userBehavior.length).toFixed(2)
        : 0,
      mostActiveUser: userBehavior[0] || null,
      leastActiveUser: userBehavior[userBehavior.length - 1] || null
    };

    // Get voting frequency distribution
    const frequencyDistribution = await Vote.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$voter',
          voteCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $lte: ['$voteCount', 1] },
              '1 vote',
              {
                $cond: [
                  { $lte: ['$voteCount', 3] },
                  '2-3 votes',
                  {
                    $cond: [
                      { $lte: ['$voteCount', 5] },
                      '4-5 votes',
                      '5+ votes'
                    ]
                  }
                ]
              }
            ]
          },
          userCount: { $sum: 1 }
        }
      }
    ]);

    const analytics = {
      timeRange,
      period: {
        start: startDate,
        end: now
      },
      engagement: engagementMetrics,
      userBehavior,
      frequencyDistribution
    };

    res.json(analytics);
  } catch (error) {
    console.error('User behavior analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch user behavior analytics' });
  }
});

// Get real-time analytics updates
router.get('/realtime', auth, async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get recent activity
    const recentVotes = await Vote.countDocuments({
      createdAt: { $gte: last24Hours }
    });

    // Get active positions
    const activePositions = await Vote.aggregate([
      {
        $match: {
          createdAt: { $gte: last24Hours }
        }
      },
      {
        $group: {
          _id: '$position',
          voteCount: { $sum: 1 }
        }
      },
      {
        $sort: { voteCount: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Get trending candidates
    const trendingCandidates = await Vote.aggregate([
      {
        $match: {
          createdAt: { $gte: last24Hours }
        }
      },
      {
        $group: {
          _id: '$candidate',
          voteCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'candidates',
          localField: '_id',
          foreignField: '_id',
          as: 'candidateInfo'
        }
      },
      {
        $unwind: '$candidateInfo'
      },
      {
        $project: {
          name: '$candidateInfo.name',
          position: '$candidateInfo.position',
          party: '$candidateInfo.party',
          recentVotes: '$voteCount'
        }
      },
      {
        $sort: { recentVotes: -1 }
      },
      {
        $limit: 5
      }
    ]);

    const realtimeData = {
      last24Hours: {
        totalVotes: recentVotes,
        activePositions: activePositions.length,
        trendingCandidates
      },
      activePositions,
      timestamp: now
    };

    res.json(realtimeData);
  } catch (error) {
    console.error('Real-time analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch real-time analytics' });
  }
});

module.exports = router; 