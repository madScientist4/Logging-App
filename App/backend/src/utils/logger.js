const crypto = require('crypto');

/**
 * Structured logging utility for API Error Logger
 * Provides JSON-formatted logs with request IDs for tracing
 */

/**
 * Generate a unique request ID for tracing
 * @returns {string} Unique request ID
 */
function generateRequestId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Log levels
 */
const LogLevel = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug'
};

/**
 * Format and output a structured log entry
 * @param {string} level - Log level (info, warn, error, debug)
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata to include in log
 */
function log(level, message, metadata = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...metadata
  };

  const output = JSON.stringify(logEntry);

  // Output to appropriate stream based on level
  if (level === LogLevel.ERROR) {
    console.error(output);
  } else {
    console.log(output);
  }
}

/**
 * Log error submission
 * @param {string} requestId - Request ID for tracing
 * @param {Object} errorRequest - Error request data
 * @param {string} status - Submission status (received, validated, failed)
 */
function logErrorSubmission(requestId, errorRequest, status) {
  log(LogLevel.INFO, 'Error submission', {
    requestId,
    event: 'error_submission',
    status,
    endpoint: errorRequest.endpoint,
    method: errorRequest.method,
    hasUserContact: !!errorRequest.userContact
  });
}

/**
 * Log validation result
 * @param {string} requestId - Request ID for tracing
 * @param {Object} validationResult - Validation result
 * @param {string} endpoint - API endpoint being validated
 * @param {string} method - HTTP method
 */
function logValidationResult(requestId, validationResult, endpoint, method) {
  log(validationResult.isValid ? LogLevel.INFO : LogLevel.WARN, 'Validation result', {
    requestId,
    event: 'validation_result',
    isValid: validationResult.isValid,
    endpoint,
    method,
    errorCount: validationResult.errors?.length || 0,
    errors: validationResult.isValid ? undefined : validationResult.errors
  });
}

/**
 * Log email delivery attempt
 * @param {string} requestId - Request ID for tracing
 * @param {string} status - Delivery status (sending, sent, failed, retrying)
 * @param {number} attempt - Attempt number (1-3)
 * @param {string} endpoint - API endpoint from error request
 * @param {Array<string>} recipients - Email recipients
 * @param {string} error - Error message if failed
 */
function logEmailDelivery(requestId, status, attempt, endpoint, recipients, error = null) {
  const level = status === 'failed' ? LogLevel.ERROR : LogLevel.INFO;
  
  log(level, 'Email delivery attempt', {
    requestId,
    event: 'email_delivery',
    status,
    attempt,
    endpoint,
    recipientCount: recipients?.length || 0,
    error: error || undefined
  });
}

/**
 * Log environment status change
 * @param {string} environmentName - Name of the environment
 * @param {string} previousStatus - Previous status (active/inactive)
 * @param {string} newStatus - New status (active/inactive)
 */
function logEnvironmentStatusChange(environmentName, previousStatus, newStatus) {
  log(LogLevel.INFO, 'Environment status change', {
    event: 'environment_status_change',
    environment: environmentName,
    previousStatus,
    newStatus,
    changed: previousStatus !== newStatus
  });
}

/**
 * Log environment health check
 * @param {string} environmentName - Name of the environment
 * @param {string} status - Status result (active/inactive)
 * @param {string} error - Error message if check failed
 */
function logEnvironmentHealthCheck(environmentName, status, error = null) {
  log(LogLevel.DEBUG, 'Environment health check', {
    event: 'environment_health_check',
    environment: environmentName,
    status,
    error: error || undefined
  });
}

/**
 * Log configuration reload
 * @param {string} reason - Reason for reload (file_change, startup, etc.)
 * @param {boolean} success - Whether reload was successful
 * @param {string} error - Error message if reload failed
 */
function logConfigurationReload(reason, success, error = null) {
  const level = success ? LogLevel.INFO : LogLevel.ERROR;
  
  log(level, 'Configuration reload', {
    event: 'configuration_reload',
    reason,
    success,
    error: error || undefined
  });
}

/**
 * Log general error
 * @param {string} message - Error message
 * @param {Error} error - Error object
 * @param {Object} metadata - Additional metadata
 */
function logError(message, error, metadata = {}) {
  log(LogLevel.ERROR, message, {
    event: 'error',
    error: error.message,
    stack: error.stack,
    ...metadata
  });
}

module.exports = {
  generateRequestId,
  LogLevel,
  log,
  logErrorSubmission,
  logValidationResult,
  logEmailDelivery,
  logEnvironmentStatusChange,
  logEnvironmentHealthCheck,
  logConfigurationReload,
  logError
};
