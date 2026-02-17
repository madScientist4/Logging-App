const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Health Check Endpoint', () => {
  it('should return status ok with timestamp', () => {
    const healthRouter = require('../src/routes/health');
    
    // Mock request and response
    const req = { path: '/health', method: 'GET' };
    const res = {
      json: (data) => {
        assert.strictEqual(data.status, 'ok', 'Status should be ok');
        assert.ok(data.timestamp, 'Timestamp should be present');
        assert.ok(new Date(data.timestamp).getTime() > 0, 'Timestamp should be valid');
      }
    };

    // Find the GET handler
    const routes = healthRouter.stack;
    const getRoute = routes.find(r => r.route && r.route.methods.get);
    
    assert.ok(getRoute, 'GET /health route should exist');
    
    // Execute the handler
    getRoute.route.stack[0].handle(req, res);
  });
});
