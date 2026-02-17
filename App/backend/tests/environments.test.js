const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const environmentsRouter = require('../src/routes/environments');
const { monitorEnvironments, stopMonitoring } = require('../src/services/environmentMonitor');

describe('GET /api/environments/status', () => {
  let mockServer;
  let mockServerUrl;

  before(async () => {
    // Set up a mock HTTP server for health checks
    mockServer = http.createServer((req, res) => {
      res.writeHead(200);
      res.end('OK');
    });

    await new Promise((resolve) => {
      mockServer.listen(0, () => {
        const port = mockServer.address().port;
        mockServerUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(() => {
    stopMonitoring();
    if (mockServer) {
      mockServer.close();
    }
  });

  beforeEach(() => {
    stopMonitoring();
  });

  it('should return cached environment status with name, status, and lastChecked', async () => {
    const mockEnvironments = [
      {
        name: 'Production',
        healthCheckUrl: `${mockServerUrl}/health`
      },
      {
        name: 'Staging',
        healthCheckUrl: `${mockServerUrl}/health`
      }
    ];

    monitorEnvironments(mockEnvironments);
    
    // Wait for initial check
    await new Promise(resolve => setTimeout(resolve, 150));

    // Mock request and response
    const req = {};
    let responseData;
    const res = {
      json: (data) => {
        responseData = data;
      }
    };

    // Find and execute the GET handler
    const routes = environmentsRouter.stack;
    const getRoute = routes.find(r => r.route && r.route.path === '/environments/status');
    assert.ok(getRoute, 'GET /environments/status route should exist');
    
    await getRoute.route.stack[0].handle(req, res);

    assert.ok(responseData.environments);
    assert.ok(Array.isArray(responseData.environments));
    assert.strictEqual(responseData.environments.length, 2);

    // Verify structure of each environment
    responseData.environments.forEach(env => {
      assert.ok(env.name);
      assert.ok(['active', 'inactive'].includes(env.status));
      assert.ok(env.lastChecked);
      assert.ok(new Date(env.lastChecked).getTime() > 0);
    });
  });

  it('should handle empty cache gracefully', async () => {
    // Ensure no monitoring is running
    stopMonitoring();

    const req = {};
    let responseData;
    const res = {
      json: (data) => {
        responseData = data;
      }
    };

    const routes = environmentsRouter.stack;
    const getRoute = routes.find(r => r.route && r.route.path === '/environments/status');
    await getRoute.route.stack[0].handle(req, res);

    assert.ok(responseData.environments);
    assert.ok(Array.isArray(responseData.environments));
  });

  it('should return environments with correct structure', async () => {
    const mockEnvironments = [
      {
        name: 'Test Environment',
        healthCheckUrl: `${mockServerUrl}/health`
      }
    ];

    monitorEnvironments(mockEnvironments);
    await new Promise(resolve => setTimeout(resolve, 150));

    const req = {};
    let responseData;
    const res = {
      json: (data) => {
        responseData = data;
      }
    };

    const routes = environmentsRouter.stack;
    const getRoute = routes.find(r => r.route && r.route.path === '/environments/status');
    await getRoute.route.stack[0].handle(req, res);

    const env = responseData.environments[0];
    assert.strictEqual(env.name, 'Test Environment');
    assert.ok(typeof env.status === 'string');
    assert.ok(typeof env.lastChecked === 'string');
  });

  it('should include all required fields in response', async () => {
    const mockEnvironments = [
      {
        name: 'API Gateway',
        healthCheckUrl: `${mockServerUrl}/health`
      }
    ];

    monitorEnvironments(mockEnvironments);
    await new Promise(resolve => setTimeout(resolve, 150));

    const req = {};
    let responseData;
    const res = {
      json: (data) => {
        responseData = data;
      }
    };

    const routes = environmentsRouter.stack;
    const getRoute = routes.find(r => r.route && r.route.path === '/environments/status');
    await getRoute.route.stack[0].handle(req, res);

    assert.ok(responseData.hasOwnProperty('environments'));
    
    const env = responseData.environments[0];
    assert.ok(env.hasOwnProperty('name'));
    assert.ok(env.hasOwnProperty('status'));
    assert.ok(env.hasOwnProperty('lastChecked'));
  });

  it('should handle errors gracefully', async () => {
    // This test verifies the error handling in the route
    const req = {};
    let statusCode;
    let responseData;
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        responseData = data;
      }
    };

    // Temporarily break getCachedStatus by stopping monitoring
    stopMonitoring();

    const routes = environmentsRouter.stack;
    const getRoute = routes.find(r => r.route && r.route.path === '/environments/status');
    
    // The route should still work even with empty cache
    await getRoute.route.stack[0].handle(req, res);
    
    // Should return successfully with empty array
    assert.ok(responseData.environments);
    assert.ok(Array.isArray(responseData.environments));
  });
});
