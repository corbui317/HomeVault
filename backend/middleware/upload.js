const fs = require('fs');
const multer = require('multer');
const path = require('path');

// Ensure the uploads directory exists at the project root
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  // Use an absolute path so uploads work regardless of the working directory
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic'];
const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];
const blockedExt = [
  '.exe', '.msi', '.bat', '.sh', '.cmd', '.js', '.php', '.py', '.rb', '.pl',
  '.pdf', '.docx', '.xlsx', '.pptx', '.zip', '.rar', '.7z', '.tar', '.gz',
  '.ini', '.env', '.json', '.xml', '.db', '.sqlite', '.log', '.svg', '.swf',
  '.ico'
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Immediately reject blatantly blocked extensions
  if (blockedExt.includes(ext)) {
    return cb(new Error('File type not allowed'), false);
  }

  const isAllowedExt = allowedExt.includes(ext);
  const isAllowedMime = allowedMime.includes(file.mimetype.toLowerCase());

  if (isAllowedExt && isAllowedMime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});
