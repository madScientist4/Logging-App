/**
 * Global error handling middleware
 * Catches all errors and returns appropriate responses
 */
function errorHandler(err, req, res, next) {
  // Log the error
  console.error({
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 
      ? 'An unexpected error occurred. Please try again.' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
