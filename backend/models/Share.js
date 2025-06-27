const mongoose = require('mongoose');

const ShareSchema = new mongoose.Schema({
  photoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Photo',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  sharedBy: {
    type: String, // Firebase UID of user who shared
    required: true
  },
  sharedWith: {
    type: String, // Email of user who received the share
    required: true
  },
  sharedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate shares
ShareSchema.index({ photoId: 1, sharedWith: 1 }, { unique: true });

module.exports = mongoose.model('Share', ShareSchema); 