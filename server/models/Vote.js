const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Voter is required']
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: [true, 'Candidate is required']
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true,
    maxlength: [100, 'Position cannot exceed 100 characters']
  },
  ipAddress: {
    type: String,
    required: [true, 'IP address is required'],
    validate: {
      validator: function(v) {
        return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v) ||
               /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(v);
      },
      message: 'Invalid IP address format'
    }
  },
  userAgent: {
    type: String,
    required: [true, 'User agent is required'],
    maxlength: [500, 'User agent cannot exceed 500 characters']
  },
  isValid: {
    type: Boolean,
    default: true
  },
  metadata: {
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },
    browser: {
      type: String,
      default: 'unknown'
    },
    os: {
      type: String,
      default: 'unknown'
    },
    location: {
      country: String,
      region: String,
      city: String
    },
    referrer: {
      type: String,
      default: null
    }
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationMethod: {
      type: String,
      enum: ['email', 'sms', 'manual', 'none'],
      default: 'none'
    },
    verifiedAt: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for vote age
voteSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for vote status
voteSchema.virtual('status').get(function() {
  if (!this.isValid) return 'Invalid';
  if (this.verification.isVerified) return 'Verified';
  return 'Pending';
});

// Virtual for device category
voteSchema.virtual('deviceCategory').get(function() {
  return this.metadata.deviceType || 'unknown';
});

// Indexes for better query performance
voteSchema.index({ voter: 1, position: 1 }, { unique: true });
voteSchema.index({ candidate: 1, isValid: 1 });
voteSchema.index({ createdAt: -1 });
voteSchema.index({ position: 1, isValid: 1 });
voteSchema.index({ voter: 1, isValid: 1 });
voteSchema.index({ 'metadata.deviceType': 1 });
voteSchema.index({ 'verification.isVerified': 1 });

// Compound indexes for common queries
voteSchema.index({ position: 1, createdAt: -1 });
voteSchema.index({ candidate: 1, createdAt: -1 });
voteSchema.index({ voter: 1, createdAt: -1 });
voteSchema.index({ isValid: 1, createdAt: -1 });

// Text index for search functionality
voteSchema.index({
  position: 'text',
  'metadata.browser': 'text',
  'metadata.os': 'text'
});

// Method to parse user agent and extract device info
voteSchema.methods.parseUserAgent = function() {
  const userAgent = this.userAgent.toLowerCase();
  
  // Detect device type
  if (/mobile|android|iphone|ipad|ipod/.test(userAgent)) {
    this.metadata.deviceType = 'mobile';
  } else if (/tablet|ipad/.test(userAgent)) {
    this.metadata.deviceType = 'tablet';
  } else {
    this.metadata.deviceType = 'desktop';
  }
  
  // Detect browser
  if (/chrome/.test(userAgent)) {
    this.metadata.browser = 'Chrome';
  } else if (/firefox/.test(userAgent)) {
    this.metadata.browser = 'Firefox';
  } else if (/safari/.test(userAgent)) {
    this.metadata.browser = 'Safari';
  } else if (/edge/.test(userAgent)) {
    this.metadata.browser = 'Edge';
  } else {
    this.metadata.browser = 'Other';
  }
  
  // Detect OS
  if (/windows/.test(userAgent)) {
    this.metadata.os = 'Windows';
  } else if (/macintosh|mac os/.test(userAgent)) {
    this.metadata.os = 'macOS';
  } else if (/linux/.test(userAgent)) {
    this.metadata.os = 'Linux';
  } else if (/android/.test(userAgent)) {
    this.metadata.os = 'Android';
  } else if (/iphone|ipad|ipod/.test(userAgent)) {
    this.metadata.os = 'iOS';
  } else {
    this.metadata.os = 'Other';
  }
  
  return this.metadata;
};

// Method to verify vote
voteSchema.methods.verify = async function(method = 'manual') {
  this.verification.isVerified = true;
  this.verification.verificationMethod = method;
  this.verification.verifiedAt = new Date();
  return await this.save();
};

// Method to invalidate vote
voteSchema.methods.invalidate = async function() {
  this.isValid = false;
  return await this.save();
};

// Method to get vote analytics
voteSchema.methods.getAnalytics = async function() {
  const User = mongoose.model('User');
  const Candidate = mongoose.model('Candidate');
  
  const [voter, candidate] = await Promise.all([
    User.findById(this.voter).select('username role'),
    Candidate.findById(this.candidate).select('name position party')
  ]);
  
  return {
    vote: {
      id: this._id,
      createdAt: this.createdAt,
      age: this.age,
      status: this.status,
      isValid: this.isValid,
      isVerified: this.verification.isVerified
    },
    voter: voter ? {
      id: voter._id,
      username: voter.username,
      role: voter.role
    } : null,
    candidate: candidate ? {
      id: candidate._id,
      name: candidate.name,
      position: candidate.position,
      party: candidate.party
    } : null,
    metadata: this.metadata
  };
};

// Static method to get vote statistics
voteSchema.statics.getStatistics = async function(options = {}) {
  const { startDate, endDate, position, candidate } = options;
  const match = { isValid: true };
  
  if (startDate) match.createdAt = { $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  if (position) match.position = position;
  if (candidate) match.candidate = candidate;
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalVotes: { $sum: 1 },
        uniqueVoters: { $addToSet: '$voter' },
        uniqueCandidates: { $addToSet: '$candidate' },
        uniquePositions: { $addToSet: '$position' },
        verifiedVotes: { $sum: { $cond: ['$verification.isVerified', 1, 0] } },
        avgVotesPerVoter: { $avg: 1 }
      }
    },
    {
      $addFields: {
        uniqueVoterCount: { $size: '$uniqueVoters' },
        uniqueCandidateCount: { $size: '$uniqueCandidates' },
        uniquePositionCount: { $size: '$uniquePositions' },
        verificationRate: {
          $multiply: [
            { $divide: ['$verifiedVotes', '$totalVotes'] },
            100
          ]
        }
      }
    }
  ]);
};

// Static method to get voting trends
voteSchema.statics.getVotingTrends = async function(days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        isValid: true
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        votes: { $sum: 1 },
        uniqueVoters: { $addToSet: '$voter' }
      }
    },
    {
      $addFields: {
        uniqueVoterCount: { $size: '$uniqueVoters' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to get device analytics
voteSchema.statics.getDeviceAnalytics = async function() {
  return this.aggregate([
    { $match: { isValid: true } },
    {
      $group: {
        _id: '$metadata.deviceType',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get browser analytics
voteSchema.statics.getBrowserAnalytics = async function() {
  return this.aggregate([
    { $match: { isValid: true } },
    {
      $group: {
        _id: '$metadata.browser',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get OS analytics
voteSchema.statics.getOSAnalytics = async function() {
  return this.aggregate([
    { $match: { isValid: true } },
    {
      $group: {
        _id: '$metadata.os',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get hourly voting patterns
voteSchema.statics.getHourlyPatterns = async function() {
  return this.aggregate([
    { $match: { isValid: true } },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to get daily voting patterns
voteSchema.statics.getDailyPatterns = async function() {
  return this.aggregate([
    { $match: { isValid: true } },
    {
      $group: {
        _id: { $dayOfWeek: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Pre-save middleware to parse user agent
voteSchema.pre('save', function(next) {
  if (this.isModified('userAgent')) {
    this.parseUserAgent();
  }
  next();
});

// Pre-save middleware to update related stats
voteSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('isValid')) {
    const Candidate = mongoose.model('Candidate');
    const User = mongoose.model('User');
    
    try {
      if (this.isNew && this.isValid) {
        // Increment candidate vote count
        await Candidate.findByIdAndUpdate(
          this.candidate,
          { $inc: { voteCount: 1 } }
        );
        
        // Update user stats
        await User.findByIdAndUpdate(
          this.voter,
          { $inc: { 'stats.totalVotes': 1 } }
        );
      } else if (this.isModified('isValid') && !this.isValid) {
        // Decrement candidate vote count
        await Candidate.findByIdAndUpdate(
          this.candidate,
          { $inc: { voteCount: -1 } }
        );
        
        // Update user stats
        await User.findByIdAndUpdate(
          this.voter,
          { $inc: { 'stats.totalVotes': -1 } }
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('Vote', voteSchema); 