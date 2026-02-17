const express = require('express');
const router = express.Router();
const { validateAgainstSwagger } = require('../validators/swaggerValidator');
const { sendNotificationEmail } = require('../services/emailService');
const { logErrorSubmission, logValidationResult } = require('../utils/logger');

/**
 * POST /api/error-reports
 * Submit an error report for validation and notification
 */
router.post('/error-reports', async (req, res, next) => {
  try {
    const { endpoint, method, payload, errorDescription, userContact } = req.body;
    const requestId = req.requestId; // Get request ID from middleware

    // Log error submission received
    logErrorSubmission(requestId, { endpoint, method, userContact }, 'received');

    // Validate request body has required fields
    const missingFields = [];
    if (!endpoint) missingFields.push('endpoint');
    if (!method) missingFields.push('method');
    if (!payload) missingFields.push('payload');
    if (!errorDescription) missingFields.push('errorDescription');

    if (missingFields.length > 0) {
      logErrorSubmission(requestId, { endpoint, method, userContact }, 'validation_failed');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        validationErrors: missingFields.map(field => `Missing required field: ${field}`)
      });
    }

    // Create error request object with timestamp
    const errorRequest = {
      endpoint,
      method,
      payload,
      errorDescription,
      userContact,
      timestamp: new Date()
    };

    // Call Swagger validator with request data
    const validationResult = await validateAgainstSwagger(
      errorRequest,
      req.app.locals.config
    );

    // Log validation result
    logValidationResult(requestId, validationResult, endpoint, method);

    // If validation fails, return validation errors
    if (!validationResult.isValid) {
      logErrorSubmission(requestId, errorRequest, 'validation_failed');
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        validationErrors: validationResult.errors
      });
    }

    // If validation passes, trigger email notification
    const emailResult = await sendNotificationEmail(
      errorRequest,
      req.app.locals.config.email.teamEmails,
      requestId
    );

    // Check if email was sent successfully
    if (!emailResult.sent) {
      // Email failed but validation passed - still return success to user
      // but log the email failure
      logErrorSubmission(requestId, errorRequest, 'email_failed');
      return res.status(500).json({
        success: false,
        message: 'Validation passed but failed to send notification email. Please try again.'
      });
    }

    // Log successful submission
    logErrorSubmission(requestId, errorRequest, 'completed');

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Error report validated and email sent to investigation team'
    });

  } catch (error) {
    // Handle errors gracefully
    next(error);
  }
});

module.exports = router;
