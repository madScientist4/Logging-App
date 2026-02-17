const nodemailer = require('nodemailer');
const { logEmailDelivery } = require('../utils/logger');

/**
 * Email notification service for sending error reports to the investigation team
 * Implements retry logic with exponential backoff
 */

/**
 * Create SMTP transporter from environment configuration
 * @returns {Object} Nodemailer transporter
 */
function createTransporter() {
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };

  return nodemailer.createTransport(config);
}

/**
 * Format email body with HTML template
 * @param {Object} errorRequest - The error request data
 * @param {string} errorRequest.endpoint - API endpoint path
 * @param {string} errorRequest.method - HTTP method
 * @param {Object} errorRequest.payload - Request payload
 * @param {string} errorRequest.errorDescription - Error description
 * @param {string} [errorRequest.userContact] - Optional user contact
 * @param {Date} errorRequest.timestamp - When error was reported
 * @returns {string} HTML formatted email body
 */
function formatEmailBody(errorRequest) {
  const { endpoint, method, payload, errorDescription, userContact, timestamp } = errorRequest;
  
  const formattedPayload = JSON.stringify(payload, null, 2);
  const formattedTimestamp = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();
  const contactSection = userContact 
    ? `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">User Contact:</td><td style="padding: 8px; border: 1px solid #ddd;">${userContact}</td></tr>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #d32f2f; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    td { padding: 8px; border: 1px solid #ddd; }
    .label { font-weight: bold; width: 200px; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>API Error Report</h1>
    <p>A new API error has been reported and validated. Please investigate the following issue:</p>
    
    <table>
      <tr>
        <td class="label">API Endpoint:</td>
        <td>${endpoint}</td>
      </tr>
      <tr>
        <td class="label">HTTP Method:</td>
        <td>${method}</td>
      </tr>
      <tr>
        <td class="label">Timestamp:</td>
        <td>${formattedTimestamp}</td>
      </tr>
      ${contactSection}
    </table>
    
    <h2>Error Description</h2>
    <p>${errorDescription}</p>
    
    <h2>Request Payload</h2>
    <pre>${formattedPayload}</pre>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send notification email with retry logic
 * @param {Object} errorRequest - The error request data
 * @param {Array<string>} teamEmails - List of team email addresses
 * @param {string} requestId - Request ID for tracing
 * @returns {Promise<Object>} Result object with sent status and error if any
 */
async function sendNotificationEmail(errorRequest, teamEmails, requestId = 'unknown') {
  const maxAttempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logEmailDelivery(requestId, 'sending', attempt, errorRequest.endpoint, teamEmails);
      
      const transporter = createTransporter();
      const emailBody = formatEmailBody(errorRequest);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'api-errors@example.com',
        to: teamEmails.join(', '),
        subject: `API Error Report: ${errorRequest.endpoint}`,
        html: emailBody
      };

      const info = await transporter.sendMail(mailOptions);
      
      logEmailDelivery(requestId, 'sent', attempt, errorRequest.endpoint, teamEmails);
      return { sent: true, error: null };
      
    } catch (error) {
      lastError = error;
      
      if (attempt < maxAttempts) {
        // Exponential backoff: 1s, 2s, 4s
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        logEmailDelivery(requestId, 'retrying', attempt, errorRequest.endpoint, teamEmails, error.message);
        await sleep(backoffMs);
      }
    }
  }

  // All attempts failed
  logEmailDelivery(requestId, 'failed', maxAttempts, errorRequest.endpoint, teamEmails, lastError.message);
  return { sent: false, error: lastError.message };
}

module.exports = {
  sendNotificationEmail,
  formatEmailBody,
  createTransporter
};
