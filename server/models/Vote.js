const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  isValid: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure one vote per user per position
voteSchema.index({ voter: 1, position: 1 }, { unique: true });

// Index for query performance
voteSchema.index({ candidate: 1, isValid: 1 });
voteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Vote', voteSchema); 