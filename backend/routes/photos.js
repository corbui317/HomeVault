const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const fs = require("fs");
const path = require("path");
const Photo = require("../models/Photo");

const uploadsDir = path.join(__dirname, "..", "..", "uploads");

router.get("/", auth, async (req, res) => {
  try {
    const files = await fs.promises.readdir(uploadsDir);
    const result = [];
    for (const f of files) {
      if (f === "trash") continue;
      let photo = await Photo.findOne({ filename: f });
      if (!photo) {
        photo = await Photo.create({
          filename: f,
          uploadedBy: req.user.uid,
        });
      }
      const trashed = photo.trashBy.includes(req.user.uid);
      if (!trashed) {
        result.push({
          name: f,
          favorite: photo.favoriteBy.includes(req.user.uid),
        });
      }
    }
    res.json({ files: result });
  } catch (err) {
    res.status(500).json({ msg: "Unable to list files" });
  }
});

router.post("/upload", auth, upload.single("photo"), async (req, res) => {
  console.log("/api/photos/upload hit");
  if (!req.file) {
    console.error("No file uploaded");
    return res.status(400).json({ msg: "No file uploaded" });
  }
  console.log("Uploaded file:", req.file);
  try {
    await Photo.create({
      filename: req.file.filename,
      uploadedBy: req.user.uid,
    });
    res.json({ filename: req.file.filename });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ msg: "Upload error" });
  }
});

router.post("/:filename/favorite", auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({ filename: req.params.filename });
    if (!photo) return res.status(404).json({ msg: "Not found" });
    const idx = photo.favoriteBy.indexOf(req.user.uid);
    let fav;
    if (idx === -1) {
      photo.favoriteBy.push(req.user.uid);
      fav = true;
    } else {
      photo.favoriteBy.splice(idx, 1);
      fav = false;
    }
    await photo.save();
    res.json({ favorite: fav });
  } catch (err) {
    res.status(500).json({ msg: "Error toggling favorite" });
  }
});

router.get("/trash", auth, async (req, res) => {
  try {
    const docs = await Photo.find({ trashBy: req.user.uid });
    const files = docs.map((d) => ({
      trashName: d.filename,
      originalName: d.filename,
    }));
    res.json({ files });
  } catch (err) {
    res.status(500).json({ msg: "Unable to list trash" });
  }
});

router.post("/trash/:name/restore", auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({ filename: req.params.name });
    if (!photo) return res.status(404).json({ msg: "Not found" });
    photo.trashBy = photo.trashBy.filter((uid) => uid !== req.user.uid);
    await photo.save();
    res.json({ msg: "Restored" });
  } catch (err) {
    res.status(500).json({ msg: "Error restoring file" });
  }
});

router.delete("/trash/:name", auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({ filename: req.params.name });
    if (!photo) return res.status(404).json({ msg: "Not found" });
    photo.trashBy = photo.trashBy.filter((uid) => uid !== req.user.uid);
    if (photo.trashBy.length === 0) {
      const filePath = path.join(uploadsDir, req.params.name);
      try {
        await fs.promises.unlink(filePath);
      } catch (e) {}
      await photo.deleteOne();
    } else {
      await photo.save();
    }
    res.json({ msg: "Deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting file" });
  }
});

router.delete("/:filename", auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({ filename: req.params.filename });
    if (!photo) return res.status(404).json({ msg: "Not found" });
    if (!photo.trashBy.includes(req.user.uid)) {
      photo.trashBy.push(req.user.uid);
      await photo.save();
    }
    res.json({ msg: "Trashed" });
  } catch (err) {
    res.status(500).json({ msg: "Error trashing file" });
  }
});

module.exports = router;
