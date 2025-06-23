const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const fs = require("fs");
const path = require("path");
const Photo = require("../models/Photo");

const uploadsDir = path.join(__dirname, "..", "..", "uploads");
const trashDir = path.join(uploadsDir, "trash");
fs.mkdirSync(trashDir, { recursive: true });
const metaPath = path.join(trashDir, "metadata.json");

function readMeta() {
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf8"));
  } catch (err) {
    return {};
  }
}

function writeMeta(meta) {
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
}

function cleanupTrash() {
  const meta = readMeta();
  const now = Date.now();
  let changed = false;
  for (const [name, info] of Object.entries(meta)) {
    if (now - info.trashedAt > 30 * 24 * 60 * 60 * 1000) {
      const filePath = path.join(trashDir, name);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      delete meta[name];
      changed = true;
    }
  }
  if (changed) writeMeta(meta);
}

cleanupTrash();
setInterval(cleanupTrash, 24 * 60 * 60 * 1000);

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
          uploadedBy: req.user.userId,
        });
      }
      const trashed = photo.trashBy.some((id) => id.equals(req.user.userId));
      if (!trashed) {
        result.push({
          name: f,
          favorite: photo.favoriteBy.some((id) => id.equals(req.user.userId)),
        });
      }
    }
    res.json({ files: result });
  } catch (err) {
    res.status(500).json({ msg: "Unable to list files" });
  }
});

router.post("/upload", auth, upload.single("photo"), async (req, res) => {
  try {
    await Photo.create({
      filename: req.file.filename,
      uploadedBy: req.user.userId,
    });
    res.json({ filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ msg: "Upload error" });
  }
});

router.post("/:filename/favorite", auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({ filename: req.params.filename });
    if (!photo) return res.status(404).json({ msg: "Not found" });
    const idx = photo.favoriteBy.findIndex((id) => id.equals(req.user.userId));
    let fav;
    if (idx === -1) {
      photo.favoriteBy.push(req.user.userId);
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
    const docs = await Photo.find({ trashBy: req.user.userId });
    const files = docs.map((d) => ({
      trashName: d.trashName,
      originalName: d.filename,
    }));
    res.json({ files });
  } catch (err) {
    res.status(500).json({ msg: "Unable to list trash" });
  }
});

router.post("/trash/:name/restore", auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({ trashName: req.params.name });
    if (!photo) return res.status(404).json({ msg: "Not found" });
    photo.trashBy = photo.trashBy.filter((id) => !id.equals(req.user.userId));
    if (photo.trashBy.length === 0) {
      const src = path.join(trashDir, req.params.name);
      const dest = path.join(uploadsDir, photo.filename);
      await fs.promises.rename(src, dest);
      photo.trashName = undefined;
    }
    await photo.save();
    res.json({ msg: "Restored" });
  } catch (err) {
    res.status(500).json({ msg: "Error restoring file" });
  }
});

router.delete("/trash/:name", auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({ trashName: req.params.name });
    if (!photo) return res.status(404).json({ msg: "Not found" });
    const filePath = path.join(trashDir, req.params.name);
    await fs.promises.unlink(filePath);
    await photo.deleteOne();
    res.json({ msg: "Deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting file" });
  }
});

router.delete("/:filename", auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({ filename: req.params.filename });
    if (!photo) return res.status(404).json({ msg: "Not found" });
    if (!photo.trashBy.some((id) => id.equals(req.user.userId))) {
      if (!photo.trashName) {
        const trashName = `${Date.now()}-${req.params.filename}`;
        await fs.promises.rename(
          path.join(uploadsDir, req.params.filename),
          path.join(trashDir, trashName)
        );
        photo.trashName = trashName;
      }
      photo.trashBy.push(req.user.userId);
      await photo.save();
    }
    res.json({ msg: "Trashed" });
  } catch (err) {
    res.status(500).json({ msg: "Error trashing file" });
  }
});

module.exports = router;
