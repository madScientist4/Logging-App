const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const {
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
} = require('../src/utils/logger');

describe('Logger', () => {
  let consoleLogCalls;
  let consoleErrorCalls;
  let originalLog;
  let originalError;

  beforeEach(() => {
    // Save original console methods
    originalLog = console.log;
    originalError = console.error;
    
    // Mock console methods
    consoleLogCalls = [];
    consoleErrorCalls = [];
    
    console.log = (...args) => consoleLogCalls.push(args);
    console.error = (...args) => consoleErrorCalls.push(args);
  });

  afterEach(() => {
    // Restore original console methods
    console.log = originalLog;
    console.error = originalError;
  });

  describe('generateRequestId', () => {
    it('should generate a unique request ID', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();

      assert.ok(id1, 'ID1 should be truthy');
      assert.ok(id2, 'ID2 should be truthy');
      assert.notStrictEqual(id1, id2, 'IDs should be unique');
      assert.strictEqual(id1.length, 32, 'ID should be 32 hex chars'); // 16 bytes = 32 hex chars
    });
  });

  describe('log', () => {
    it('should output JSON formatted log to console.log for info level', () => {
      log(LogLevel.INFO, 'Test message', { key: 'value' });

      assert.strictEqual(consoleLogCalls.length, 1, 'Should log once');
      const logOutput = consoleLogCalls[0][0];
      const parsed = JSON.parse(logOutput);

      assert.strictEqual(parsed.level, 'info');
      assert.strictEqual(parsed.message, 'Test message');
      assert.strictEqual(parsed.key, 'value');
      assert.ok(parsed.timestamp, 'Timestamp should exist');
    });

    it('should output JSON formatted log to console.error for error level', () => {
      log(LogLevel.ERROR, 'Error message', { error: 'details' });

      assert.strictEqual(consoleErrorCalls.length, 1, 'Should log error once');
      const logOutput = consoleErrorCalls[0][0];
      const parsed = JSON.parse(logOutput);

      assert.strictEqual(parsed.level, 'error');
      assert.strictEqual(parsed.message, 'Error message');
      assert.strictEqual(parsed.error, 'details');
    });
  });

  describe('logErrorSubmission', () => {
    it('should log error submission with request ID', () => {
      const requestId = 'test-request-id';
      const errorRequest = {
        endpoint: '/api/test',
        method: 'POST',
        userContact: 'user@example.com'
      };

      logErrorSubmission(requestId, errorRequest, 'received');

      assert.strictEqual(consoleLogCalls.length, 1);
      const logOutput = consoleLogCalls[0][0];
      const parsed = JSON.parse(logOutput);

      assert.strictEqual(parsed.requestId, requestId);
      assert.strictEqual(parsed.event, 'error_submission');
      assert.strictEqual(parsed.status, 'received');
      assert.strictEqual(parsed.endpoint, '/api/test');
      assert.strictEqual(parsed.method, 'POST');
      assert.strictEqual(parsed.hasUserContact, true);
    });
  });

  describe('logValidationResult', () => {
    it('should log successful validation result', () => {
      const requestId = 'test-request-id';
      const validationResult = { isValid: true, errors: [] };

      logValidationResult(requestId, validationResult, '/api/test', 'POST');

      assert.strictEqual(consoleLogCalls.length, 1);
      const logOutput = consoleLogCalls[0][0];
      const parsed = JSON.parse(logOutput);

      assert.strictEqual(parsed.level, 'info');
      assert.strictEqual(parsed.requestId, requestId);
      assert.strictEqual(parsed.event, 'validation_result');
      assert.strictEqual(parsed.isValid, true);
      assert.strictEqual(parsed.errorCount, 0);
    });

    it('should log failed validation result with errors', () => {
      const requestId = 'test-request-id';
      const validationResult = {
        isValid: false,
        errors: ['Missing field: name', 'Invalid type: age']
      };

      logValidationResult(requestId, validationResult, '/api/test', 'POST');

      assert.strictEqual(consoleLogCalls.length, 1);
      const logOutput = consoleLogCalls[0][0];
      const parsed = JSON.parse(logOutput);

      assert.strictEqual(parsed.level, 'warn');
      assert.strictEqual(parsed.isValid, false);
      assert.strictEqual(parsed.errorCount, 2);
      assert.deepStrictEqual(parsed.errors, ['Missing field: name', 'Invalid type: age']);
    });
  });

  describe('logEmailDelivery', () => {
    it('should log email delivery attempt', () => {
      const requestId = 'test-request-id';
      const recipients = ['team@example.com'];

      logEmailDelivery(requestId, 'sending', 1, '/api/test', recipients);

      assert.strictEqual(consoleLogCalls.length, 1);
      const logOutput = consoleLogCalls[0][0];
      const parsed = JSON.parse(logOutput);

      assert.strictEqual(parsed.requestId, requestId);
      assert.strictEqual(parsed.event, 'email_delivery');
      assert.strictEqual(parsed.status, 'sending');
      assert.strictEqual(parsed.attempt, 1);
      assert.strictEqual(parsed.endpoint, '/api/test');
      assert.strictEqual(parsed.recipientCount, 1);
    });

    it('should log failed email delivery with error', () => {
      const requestId = 'test-request-id';
      const recipients = ['team@example.com'];

      logEmailDelivery(requestId, 'failed', 3, '/api/test', recipients, 'SMTP connection failed');

      assert.strictEqual(consoleErrorCalls.length, 1);
      const logOutput = consoleErrorCalls[0][0];
      const parsed = JSON.parse(logOutput);

      assert.strictEqual(parsed.level, 'error');
      assert.strictEqual(parsed.status, 'failed');
      assert.strictEqual(parsed.error, 'SMTP connection failed');
    });
  });

  describe('logEnvironmentStatusChange', () => {
    it('should log environment status change', () => {
      logEnvironmentStatusChange('Production', 'active', 'inactive');

      assert.strictEqual(consoleLogCalls.length, 1);
      const logOutput = consoleLogCalls[0][0];
      const parsed = JSON.parse(logOutput);

      assert.strictEqual(parsed.event, 'environment_status_change');
      assert.strictEqual(parsed.environment, 'Production');
      assert.strictEqual(parsed.previousStatus, 'active');
      assert.strictEqual(parsed.newStatus, 'inactive');
      assert.strictEqual(parsed.changed, true);
    });
  });

  describe('logEnvironmentHealthCheck', () => {
    it('should log environment health check', () => {
      logEnvironmentHealthCheck('Production', 'active');

      assert.strictEqual(consoleLogCalls.length, 1);
      const logOutput = consoleLogCalls[0][0];
      const parsed = JSON.parse(logOutput);

      assert.strictEqual(parsed.level, 'debug');
      assert.strictEqual(parsed.event, 'environment_health_check');
      assert.strictEqual(parsed.environment, 'Production');
      assert.strictEqual(parsed.status, 'active');
    });
  });

  describe('logConfigurationReload', () => {
    it('should log successful configuration reload', () => {
      logConfigurationReload('startup', true);

      assert.strictEqual(consoleLogCalls.length, 1);
      const logOutput = consoleLogCalls[0][0];
      const parsed = JSON.parse(logOutput);

      assert.strictEqual(parsed.level, 'info');
      assert.strictEqual(parsed.event, 'configuration_reload');
      assert.strictEqual(parsed.reason, 'startup');
      assert.strictEqual(parsed.success, true);
    });

    it('should log failed configuration reload', () => {
      logConfigurationReload('file_change', false, 'Invalid JSON');

      assert.strictEqual(consoleErrorCalls.length, 1);
      const logOutput = consoleErrorCalls[0][0];
      const parsed = JSON.parse(logOutput);

      assert.strictEqual(parsed.level, 'error');
      assert.strictEqual(parsed.success, false);
      assert.strictEqual(parsed.error, 'Invalid JSON');
    });
  });

  describe('logError', () => {
    it('should log error with stack trace', () => {
      const error = new Error('Test error');
      logError('Something went wrong', error, { context: 'test' });

      assert.strictEqual(consoleErrorCalls.length, 1);
      const logOutput = consoleErrorCalls[0][0];
      const parsed = JSON.parse(logOutput);

      assert.strictEqual(parsed.level, 'error');
      assert.strictEqual(parsed.message, 'Something went wrong');
      assert.strictEqual(parsed.event, 'error');
      assert.strictEqual(parsed.error, 'Test error');
      assert.ok(parsed.stack, 'Stack trace should exist');
      assert.strictEqual(parsed.context, 'test');
    });
  });
});
