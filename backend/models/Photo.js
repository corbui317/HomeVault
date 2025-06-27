const mongoose = require("mongoose");

const PhotoSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true },
  uploadedBy: {
    type: String, // Firebase UID
    required: true,
  },
  favoriteBy: [{ type: String }], // Firebase UIDs
  trashBy: [{ type: String }], // Firebase UIDs
  trashName: String,
  sharedWith: [{ 
    email: { type: String, required: true },
    sharedAt: { type: Date, default: Date.now }
  }], // Emails of users this photo is shared with
  isPublic: { type: Boolean, default: false }, // For future public sharing feature
}, {
  timestamps: true
});

// Add indexes for performance optimization
PhotoSchema.index({ uploadedBy: 1, createdAt: -1 }); // For user's photos
PhotoSchema.index({ 'sharedWith.email': 1 }); // For shared photos
PhotoSchema.index({ uploadedBy: 1, trashBy: 1 }); // For trash queries
PhotoSchema.index({ filename: 1 }, { unique: true }); // Already unique, but explicit index

module.exports = mongoose.model("Photo", PhotoSchema);
