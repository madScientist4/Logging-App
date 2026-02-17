const { generateRequestId } = require('../utils/logger');

/**
 * Middleware to generate and attach request ID to each request
 * The request ID is used for tracing throughout the request lifecycle
 */
function requestIdMiddleware(req, res, next) {
  // Generate unique request ID
  req.requestId = generateRequestId();
  
  // Add request ID to response headers for client-side tracing
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
}

module.exports = requestIdMiddleware;
