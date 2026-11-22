/**
 * Multer File Upload Configuration & Validation Middleware
 * Academic Project: Network Event Log Analyzer
 */

const multer = require('multer');
const path = require('path');

// Store file in memory buffer for immediate regex parsing and validation
const storage = multer.memoryStorage();

// Allowed file extensions and MIME types
const ALLOWED_EXTENSIONS = ['.txt', '.log'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 Megabytes

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new Error(`Unsupported file type '${ext}'. Please upload plain text log files (.txt or .log).`),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter
});

module.exports = upload;
