const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const fs = require("fs");
const path = require("path");

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

router.get("/", auth, (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) return res.status(500).json({ msg: "Unable to list files" });
    const filtered = files.filter((f) => f !== "trash");
    res.json({ files: filtered });
  });
});

router.post("/upload", auth, upload.single("photo"), (req, res) => {
  res.json({ filename: req.file.filename });
});

router.get("/trash", auth, (req, res) => {
  cleanupTrash();
  const meta = readMeta();
  const files = Object.keys(meta).map((name) => ({
    trashName: name,
    originalName: meta[name].originalName,
  }));
  res.json({ files });
});

router.post("/trash/:name/restore", auth, (req, res) => {
  const meta = readMeta();
  const entry = meta[req.params.name];
  if (!entry) return res.status(404).json({ msg: "Not found" });
  const src = path.join(trashDir, req.params.name);
  const dest = path.join(uploadsDir, entry.originalName);
  fs.rename(src, dest, (err) => {
    if (err) return res.status(500).json({ msg: "Error restoring file" });
    delete meta[req.params.name];
    writeMeta(meta);
    res.json({ msg: "Restored" });
  });
});

router.delete("/trash/:name", auth, (req, res) => {
  const meta = readMeta();
  const filePath = path.join(trashDir, req.params.name);
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ msg: "Error deleting file" });
    delete meta[req.params.name];
    writeMeta(meta);
    res.json({ msg: "Deleted" });
  });
});

router.delete("/:filename", auth, (req, res) => {
  const src = path.join(uploadsDir, req.params.filename);
  const meta = readMeta();
  const trashName = `${Date.now()}-${req.params.filename}`;
  const dest = path.join(trashDir, trashName);
  fs.rename(src, dest, (err) => {
    if (err) return res.status(500).json({ msg: "Error trashing file" });
    meta[trashName] = {
      originalName: req.params.filename,
      trashedAt: Date.now(),
    };
    writeMeta(meta);
    res.json({ msg: "Trashed" });
  });
});

module.exports = router;
