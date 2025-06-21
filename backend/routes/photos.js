const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

router.get('/', auth, (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) return res.status(500).json({ msg: 'Unable to list files' });
    res.json({ files });
  });
});

router.post('/upload', auth, upload.single('photo'), (req, res) => {
  res.json({ filename: req.file.filename });
});

router.delete('/:filename', auth, (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  fs.unlink(filePath, err => {
    if (err) return res.status(500).json({ msg: 'Error deleting file' });
    res.json({ msg: 'Deleted' });
  });
});

module.exports = router;