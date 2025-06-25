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
});

module.exports = mongoose.model("Photo", PhotoSchema);
