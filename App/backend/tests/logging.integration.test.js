const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

describe('Structured Logging Integration', () => {
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

  it('should log error submission with request ID', async () => {
    const errorReportsRouter = require('../src/routes/errorReports');
    const path = require('path');
    
    const req = {
      body: {
        endpoint: '/api/users',
        method: 'POST',
        payload: { name: 'John Doe', email: 'john@example.com' },
        errorDescription: 'User creation failed with 500 error'
      },
      app: {
        locals: {
          config: {
            swaggerSpecs: [
              {
                pattern: '/api/users/*',
                specUrl: path.join(__dirname, 'fixtures/sample-swagger.json')
              }
            ],
            email: {
              teamEmails: ['team@example.com']
            }
          }
        }
      }
    };
    
    let responseData;
    let statusCode;
    
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        responseData = data;
      }
    };
    
    const routes = errorReportsRouter.stack;
    const postRoute = routes.find(r => r.route && r.route.methods.post);
    
    await postRoute.route.stack[0].handle(req, res, () => {});

    // Check that structured logs were created
    const logs = consoleLogCalls.map(call => {
      try {
        return JSON.parse(call[0]);
      } catch {
        return null;
      }
    }).filter(log => log !== null);

    // Should have logs for error submission
    const submissionLogs = logs.filter(log => log.event === 'error_submission');
    assert.ok(submissionLogs.length > 0, 'Should have error submission logs');

    // Check that request ID is present
    const firstLog = submissionLogs[0];
    assert.ok(firstLog.requestId, 'Should have request ID');
    assert.strictEqual(firstLog.endpoint, '/api/users');
    assert.strictEqual(firstLog.method, 'POST');
  });

  it('should log validation results with request ID', async () => {
    const errorReportsRouter = require('../src/routes/errorReports');
    const path = require('path');
    
    const req = {
      body: {
        endpoint: '/api/users',
        method: 'POST',
        payload: { name: 'John Doe' },
        errorDescription: 'Test error'
      },
      app: {
        locals: {
          config: {
            swaggerSpecs: [
              {
                pattern: '/api/users/*',
                specUrl: path.join(__dirname, 'fixtures/sample-swagger.json')
              }
            ],
            email: {
              teamEmails: ['team@example.com']
            }
          }
        }
      }
    };
    
    let responseData;
    let statusCode;
    
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        responseData = data;
      }
    };
    
    const routes = errorReportsRouter.stack;
    const postRoute = routes.find(r => r.route && r.route.methods.post);
    
    await postRoute.route.stack[0].handle(req, res, () => {});

    // Check for validation result logs
    const logs = consoleLogCalls.map(call => {
      try {
        return JSON.parse(call[0]);
      } catch {
        return null;
      }
    }).filter(log => log !== null);

    const validationLogs = logs.filter(log => log.event === 'validation_result');
    assert.ok(validationLogs.length > 0, 'Should have validation result logs');

    const validationLog = validationLogs[0];
    assert.ok(validationLog.requestId, 'Should have request ID');
    assert.strictEqual(validationLog.endpoint, '/api/users');
    assert.ok(validationLog.hasOwnProperty('isValid'), 'Should have isValid property');
  });

  it('should include request ID in middleware', () => {
    const { generateRequestId } = require('../src/utils/logger');
    
    const requestId = generateRequestId();
    assert.ok(requestId, 'Should generate request ID');
    assert.strictEqual(requestId.length, 32, 'Request ID should be 32 characters');
  });
});
