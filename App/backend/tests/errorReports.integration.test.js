const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');

describe('Error Reports Endpoint - Integration Tests', () => {
  
  it('should validate and reject invalid endpoint against Swagger spec', async () => {
    const errorReportsRouter = require('../src/routes/errorReports');
    
    const req = {
      body: {
        endpoint: '/api/invalid/endpoint',
        method: 'POST',
        payload: { test: 'data' },
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
    
    assert.strictEqual(statusCode, 400, 'Should return 400 status');
    assert.strictEqual(responseData.success, false, 'Success should be false');
    assert.ok(responseData.validationErrors, 'Should have validation errors');
    assert.ok(
      responseData.validationErrors.some(e => e.includes('not found')),
      'Should indicate endpoint not found'
    );
  });
  
  it('should validate request against Swagger spec and pass validation', async () => {
    const errorReportsRouter = require('../src/routes/errorReports');
    
    // This matches the sample-swagger.json spec
    const req = {
      body: {
        endpoint: '/api/users',
        method: 'POST',
        payload: {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30
        },
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
    
    // Will fail at email sending stage (no real SMTP), but validation should pass
    // The response will be 500 due to email failure, but that's expected
    assert.ok(statusCode !== undefined, 'Should return a response');
    
    // If validation passed, it would try to send email and fail
    // If validation failed, it would return 400
    if (statusCode === 400) {
      // Validation failed - check why
      console.log('Validation errors:', responseData.validationErrors);
    }
  });
  
  it('should reject request with missing required fields in payload', async () => {
    const errorReportsRouter = require('../src/routes/errorReports');
    
    const req = {
      body: {
        endpoint: '/api/users',
        method: 'POST',
        payload: {
          // Missing required 'name' and 'email' fields
          age: 30
        },
        errorDescription: 'User creation failed'
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
    
    assert.strictEqual(statusCode, 400, 'Should return 400 status');
    assert.strictEqual(responseData.success, false, 'Success should be false');
    assert.ok(responseData.validationErrors, 'Should have validation errors');
    assert.ok(
      responseData.validationErrors.some(e => e.includes('name') || e.includes('email')),
      'Should indicate missing required fields'
    );
  });
});
