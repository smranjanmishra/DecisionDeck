const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'Role must be either user or admin'
    },
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    avatar: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    }
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  },
  stats: {
    totalVotes: {
      type: Number,
      default: 0
    },
    positionsVoted: {
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

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  return this.fullName || this.username;
});

// Virtual for account age
userSchema.virtual('accountAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'stats.totalVotes': -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ createdAt: -1 });

// Compound indexes for common queries
userSchema.index({ isActive: 1, role: 1 });
userSchema.index({ email: 1, isActive: 1 });

// Enhanced password hashing with better error handling
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Check password strength
    if (this.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to get user without sensitive data
userSchema.methods.toSafeJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

// Method to update user stats
userSchema.methods.updateStats = async function() {
  const Vote = mongoose.model('Vote');
  
  const stats = await Vote.aggregate([
    { $match: { voter: this._id } },
    {
      $group: {
        _id: null,
        totalVotes: { $sum: 1 },
        positionsVoted: { $addToSet: '$position' },
        lastVoteDate: { $max: '$createdAt' }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.stats.totalVotes = stats[0].totalVotes;
    this.stats.positionsVoted = stats[0].positionsVoted.length;
    this.stats.lastVoteDate = stats[0].lastVoteDate;
    await this.save();
  }
  
  return this.stats;
};

// Method to check if user can vote for position
userSchema.methods.canVoteForPosition = async function(position) {
  const Vote = mongoose.model('Vote');
  const existingVote = await Vote.findOne({
    voter: this._id,
    position: position
  });
  return !existingVote;
};

// Static method to get user analytics
userSchema.statics.getAnalytics = async function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
        adminUsers: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
        avgVotesPerUser: { $avg: '$stats.totalVotes' },
        totalVotes: { $sum: '$stats.totalVotes' }
      }
    }
  ]);
};

// Static method to get top voters
userSchema.statics.getTopVoters = async function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'stats.totalVotes': -1 })
    .limit(limit)
    .select('username profile stats');
};

// Method to update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return await this.save();
};

// Pre-remove middleware to clean up related data
userSchema.pre('remove', async function(next) {
  const Vote = mongoose.model('Vote');
  const Candidate = mongoose.model('Candidate');
  
  try {
    // Remove user's votes
    await Vote.deleteMany({ voter: this._id });
    
    // If user created candidates, deactivate them
    await Candidate.updateMany(
      { createdBy: this._id },
      { isActive: false }
    );
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema); 