const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/upload', auth, upload.single('photo'), (req, res) => {
  res.json({ filename: req.file.filename });
});

router.delete('/:filename', auth, (req, res) => {
  // Logic to delete from filesystem
  res.json({ msg: 'Deleted' });
});

module.exports = router;