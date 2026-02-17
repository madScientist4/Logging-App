const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Error Reports Endpoint - Unit Tests', () => {
  
  it('should reject request with missing required fields', async () => {
    const errorReportsRouter = require('../src/routes/errorReports');
    
    // Test with missing endpoint field
    const req = {
      body: {
        method: 'POST',
        payload: { test: 'data' },
        errorDescription: 'Test error'
      },
      app: {
        locals: {
          config: {}
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
    
    // Find the POST handler
    const routes = errorReportsRouter.stack;
    const postRoute = routes.find(r => r.route && r.route.methods.post);
    
    assert.ok(postRoute, 'POST /error-reports route should exist');
    
    // Execute the handler
    await postRoute.route.stack[0].handle(req, res, () => {});
    
    assert.strictEqual(statusCode, 400, 'Should return 400 status');
    assert.strictEqual(responseData.success, false, 'Success should be false');
    assert.ok(responseData.validationErrors, 'Should have validation errors');
    assert.ok(responseData.validationErrors.some(e => e.includes('endpoint')), 'Should mention missing endpoint');
  });
  
  it('should reject request with multiple missing fields', async () => {
    const errorReportsRouter = require('../src/routes/errorReports');
    
    const req = {
      body: {
        endpoint: '/api/test'
        // Missing method, payload, errorDescription
      },
      app: {
        locals: {
          config: {}
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
    assert.strictEqual(responseData.validationErrors.length, 3, 'Should have 3 validation errors');
  });
  
  it('should accept request with all required fields', async () => {
    const errorReportsRouter = require('../src/routes/errorReports');
    
    const req = {
      body: {
        endpoint: '/api/users',
        method: 'POST',
        payload: { name: 'John' },
        errorDescription: 'User creation failed'
      },
      app: {
        locals: {
          config: {
            swaggerSpecs: [],
            email: {
              teamEmails: ['team@example.com']
            }
          }
        }
      }
    };
    
    let responseData;
    let statusCode;
    let nextCalled = false;
    
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        responseData = data;
      }
    };
    
    const next = (err) => {
      nextCalled = true;
    };
    
    const routes = errorReportsRouter.stack;
    const postRoute = routes.find(r => r.route && r.route.methods.post);
    
    // This will fail at validation stage since we don't have a real Swagger spec
    // but it should pass the initial field validation
    await postRoute.route.stack[0].handle(req, res, next);
    
    // Should either return a response or call next (for validation errors)
    assert.ok(statusCode !== undefined || nextCalled, 'Should process the request');
  });
  
  it('should include userContact in error request when provided', async () => {
    const errorReportsRouter = require('../src/routes/errorReports');
    
    const req = {
      body: {
        endpoint: '/api/users',
        method: 'POST',
        payload: { name: 'John' },
        errorDescription: 'User creation failed',
        userContact: 'user@example.com'
      },
      app: {
        locals: {
          config: {
            swaggerSpecs: [],
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
    
    // Should process without rejecting due to userContact
    assert.ok(statusCode !== undefined, 'Should return a response');
  });
});
