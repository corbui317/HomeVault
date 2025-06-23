const mongoose = require("mongoose");

const PhotoSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  favoriteBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  trashBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  trashName: String,
});

module.exports = mongoose.model("Photo", PhotoSchema);
