/**
 * Centralized Error Handling Middleware
 * Academic Project: Network Event Log Analyzer
 */

function errorHandler(err, req, res, next) {
  console.error('[API ERROR]', err);

  // Multer specific file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds maximum limit of 2MB.',
        code: err.code
      });
    }
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`,
      code: err.code
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      error: 'Database validation error',
      details: messages
    });
  }

  // CastError (e.g. invalid MongoDB ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid resource identifier: '${err.value}'`
    });
  }

  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
}

module.exports = errorHandler;
