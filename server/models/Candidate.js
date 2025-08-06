const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Candidate name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
    match: [/^[a-zA-Z\s\-\.]+$/, 'Name can only contain letters, spaces, hyphens, and periods']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow null/empty
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Image must be a valid URL ending with jpg, jpeg, png, gif, or webp'
    }
  },
  party: {
    type: String,
    trim: true,
    maxlength: [100, 'Party name cannot exceed 100 characters']
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true,
    maxlength: [100, 'Position cannot exceed 100 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  voteCount: {
    type: Number,
    default: 0,
    min: [0, 'Vote count cannot be negative']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  metadata: {
    campaignSlogan: {
      type: String,
      maxlength: [200, 'Campaign slogan cannot exceed 200 characters']
    },
    experience: {
      type: String,
      maxlength: [1000, 'Experience description cannot exceed 1000 characters']
    },
    education: {
      type: String,
      maxlength: [500, 'Education cannot exceed 500 characters']
    },
    website: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Website must be a valid URL'
      }
    },
    socialMedia: {
      twitter: String,
      facebook: String,
      linkedin: String,
      instagram: String
    }
  },
  stats: {
    totalVotes: {
      type: Number,
      default: 0
    },
    recentVotes: {
      type: Number,
      default: 0
    },
    votePercentage: {
      type: Number,
      default: 0
    },
    positionRank: {
      type: Number,
      default: 0
    },
    lastVoteDate: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for display name
candidateSchema.virtual('displayName').get(function() {
  return this.party ? `${this.name} (${this.party})` : this.name;
});

// Virtual for vote percentage
candidateSchema.virtual('votePercentage').get(function() {
  return this.stats.votePercentage || 0;
});

// Virtual for position ranking
candidateSchema.virtual('ranking').get(function() {
  return this.stats.positionRank || 0;
});

// Virtual for campaign status
candidateSchema.virtual('campaignStatus').get(function() {
  if (!this.isActive) return 'Inactive';
  if (this.stats.totalVotes > 100) return 'Leading';
  if (this.stats.totalVotes > 50) return 'Competitive';
  return 'New';
});

// Indexes for better query performance
candidateSchema.index({ position: 1, isActive: 1 });
candidateSchema.index({ voteCount: -1 });
candidateSchema.index({ 'stats.totalVotes': -1 });
candidateSchema.index({ 'stats.positionRank': 1 });
candidateSchema.index({ createdBy: 1 });
candidateSchema.index({ party: 1 });
candidateSchema.index({ createdAt: -1 });

// Compound indexes for common queries
candidateSchema.index({ position: 1, isActive: 1, voteCount: -1 });
candidateSchema.index({ isActive: 1, 'stats.totalVotes': -1 });

// Text index for search functionality
candidateSchema.index({
  name: 'text',
  description: 'text',
  party: 'text',
  position: 'text'
});

// Method to update candidate stats
candidateSchema.methods.updateStats = async function() {
  const Vote = mongoose.model('Vote');
  
  // Get total votes for this candidate
  const totalVotes = await Vote.countDocuments({ candidate: this._id });
  
  // Get recent votes (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentVotes = await Vote.countDocuments({
    candidate: this._id,
    createdAt: { $gte: sevenDaysAgo }
  });
  
  // Get position ranking
  const positionRanking = await Vote.aggregate([
    { $match: { position: this.position } },
    {
      $group: {
        _id: '$candidate',
        voteCount: { $sum: 1 }
      }
    },
    { $sort: { voteCount: -1 } }
  ]);
  
  const rank = positionRanking.findIndex(c => c._id.toString() === this._id.toString()) + 1;
  
  // Get total votes for position
  const totalPositionVotes = await Vote.countDocuments({ position: this.position });
  
  // Calculate percentage
  const percentage = totalPositionVotes > 0 ? ((totalVotes / totalPositionVotes) * 100) : 0;
  
  // Get last vote date
  const lastVote = await Vote.findOne({ candidate: this._id })
    .sort({ createdAt: -1 })
    .select('createdAt');
  
  // Update stats
  this.stats.totalVotes = totalVotes;
  this.stats.recentVotes = recentVotes;
  this.stats.votePercentage = percentage;
  this.stats.positionRank = rank;
  this.stats.lastVoteDate = lastVote ? lastVote.createdAt : null;
  
  // Update main vote count for backward compatibility
  this.voteCount = totalVotes;
  
  await this.save();
  return this.stats;
};

// Method to get vote history
candidateSchema.methods.getVoteHistory = async function(days = 30) {
  const Vote = mongoose.model('Vote');
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return await Vote.aggregate([
    {
      $match: {
        candidate: this._id,
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
};

// Method to get voter demographics
candidateSchema.methods.getVoterDemographics = async function() {
  const Vote = mongoose.model('Vote');
  
  return await Vote.aggregate([
    { $match: { candidate: this._id } },
    {
      $lookup: {
        from: 'users',
        localField: 'voter',
        foreignField: '_id',
        as: 'voterInfo'
      }
    },
    { $unwind: '$voterInfo' },
    {
      $group: {
        _id: '$voterInfo.role',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get candidates by position
candidateSchema.statics.getByPosition = async function(position, options = {}) {
  const query = { position, isActive: true };
  
  if (options.search) {
    query.$text = { $search: options.search };
  }
  
  return this.find(query)
    .populate('createdBy', 'username')
    .sort({ 'stats.totalVotes': -1, createdAt: -1 })
    .limit(options.limit || 50);
};

// Static method to get top candidates
candidateSchema.statics.getTopCandidates = async function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'stats.totalVotes': -1 })
    .limit(limit)
    .select('name position party stats');
};

// Static method to get position analytics
candidateSchema.statics.getPositionAnalytics = async function(position) {
  return this.aggregate([
    { $match: { position, isActive: true } },
    {
      $group: {
        _id: null,
        totalCandidates: { $sum: 1 },
        totalVotes: { $sum: '$stats.totalVotes' },
        avgVotesPerCandidate: { $avg: '$stats.totalVotes' },
        maxVotes: { $max: '$stats.totalVotes' },
        minVotes: { $min: '$stats.totalVotes' }
      }
    }
  ]);
};

// Method to increment vote count
candidateSchema.methods.incrementVoteCount = async function() {
  this.voteCount += 1;
  this.stats.totalVotes += 1;
  this.stats.recentVotes += 1;
  this.stats.lastVoteDate = new Date();
  return await this.save();
};

// Method to decrement vote count
candidateSchema.methods.decrementVoteCount = async function() {
  this.voteCount = Math.max(0, this.voteCount - 1);
  this.stats.totalVotes = Math.max(0, this.stats.totalVotes - 1);
  this.stats.recentVotes = Math.max(0, this.stats.recentVotes - 1);
  return await this.save();
};

// Pre-save middleware to update stats
candidateSchema.pre('save', async function(next) {
  if (this.isModified('voteCount') || this.isModified('stats')) {
    await this.updateStats();
  }
  next();
});

// Pre-remove middleware to clean up votes
candidateSchema.pre('remove', async function(next) {
  const Vote = mongoose.model('Vote');
  
  try {
    // Remove all votes for this candidate
    await Vote.deleteMany({ candidate: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Candidate', candidateSchema); 