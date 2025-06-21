const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = /jpg|jpeg|png/;
  const isValid = ext.test(path.extname(file.originalname).toLowerCase()) && ext.test(file.mimetype);
  cb(null, isValid);
};

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});
