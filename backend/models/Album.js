const mongoose = require("mongoose");

const AlbumSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photos: [{ type: String }], // array of photo filenames
  createdBy: { type: String, required: true }, // Firebase UID
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Album", AlbumSchema);
