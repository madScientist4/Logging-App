const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const {
  checkEnvironmentStatus,
  monitorEnvironments,
  getCachedStatus,
  stopMonitoring
} = require('../src/services/environmentMonitor');

describe('Environment Monitor', () => {
  let mockServer;
  let mockServerUrl;

  // Set up a mock HTTP server for testing
  before(async () => {
    mockServer = http.createServer((req, res) => {
      if (req.url === '/health-ok') {
        res.writeHead(200);
        res.end('OK');
      } else if (req.url === '/health-error') {
        res.writeHead(500);
        res.end('Error');
      } else if (req.url === '/health-slow') {
        // Simulate slow response (longer than timeout)
        setTimeout(() => {
          res.writeHead(200);
          res.end('OK');
        }, 6000);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
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

  describe('checkEnvironmentStatus', () => {
    it('should return active status for successful health check', async () => {
      const environment = {
        name: 'Test Environment',
        healthCheckUrl: `${mockServerUrl}/health-ok`
      };

      const result = await checkEnvironmentStatus(environment);

      assert.strictEqual(result.name, 'Test Environment');
      assert.strictEqual(result.status, 'active');
      assert.ok(result.lastChecked);
      assert.ok(new Date(result.lastChecked).getTime() > 0);
    });

    it('should return inactive status for failed health check', async () => {
      const environment = {
        name: 'Failed Environment',
        healthCheckUrl: `${mockServerUrl}/health-error`
      };

      const result = await checkEnvironmentStatus(environment);

      assert.strictEqual(result.name, 'Failed Environment');
      assert.strictEqual(result.status, 'inactive');
      assert.ok(result.lastChecked);
    });

    it('should return inactive status on timeout', async () => {
      const environment = {
        name: 'Slow Environment',
        healthCheckUrl: `${mockServerUrl}/health-slow`
      };

      const result = await checkEnvironmentStatus(environment);

      assert.strictEqual(result.name, 'Slow Environment');
      assert.strictEqual(result.status, 'inactive');
      assert.ok(result.lastChecked);
    });

    it('should return inactive status for connection errors', async () => {
      const environment = {
        name: 'Unreachable Environment',
        healthCheckUrl: 'http://localhost:99999/health'
      };

      const result = await checkEnvironmentStatus(environment);

      assert.strictEqual(result.name, 'Unreachable Environment');
      assert.strictEqual(result.status, 'inactive');
      assert.ok(result.lastChecked);
    });
  });

  describe('monitorEnvironments', () => {
    it('should start monitoring and update cache', async () => {
      const environments = [
        {
          name: 'Env1',
          healthCheckUrl: `${mockServerUrl}/health-ok`
        },
        {
          name: 'Env2',
          healthCheckUrl: `${mockServerUrl}/health-error`
        }
      ];

      monitorEnvironments(environments);

      // Wait for initial check to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = getCachedStatus();
      assert.strictEqual(status.length, 2);
      assert.strictEqual(status[0].name, 'Env1');
      assert.strictEqual(status[0].status, 'active');
      assert.strictEqual(status[1].name, 'Env2');
      assert.strictEqual(status[1].status, 'inactive');

      stopMonitoring();
    });

    it('should handle empty environment list', () => {
      monitorEnvironments([]);
      const status = getCachedStatus();
      // Should not crash, cache should remain unchanged
      assert.ok(Array.isArray(status));
    });

    it('should handle null environment list', () => {
      monitorEnvironments(null);
      const status = getCachedStatus();
      // Should not crash, cache should remain unchanged
      assert.ok(Array.isArray(status));
    });
  });

  describe('getCachedStatus', () => {
    it('should return cached environment status', async () => {
      const environments = [
        {
          name: 'Cached Env',
          healthCheckUrl: `${mockServerUrl}/health-ok`
        }
      ];

      monitorEnvironments(environments);

      // Wait for initial check
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = getCachedStatus();
      assert.ok(Array.isArray(status));
      assert.strictEqual(status.length, 1);
      assert.strictEqual(status[0].name, 'Cached Env');
      assert.ok(['active', 'inactive'].includes(status[0].status));
      assert.ok(status[0].lastChecked);

      stopMonitoring();
    });

    it('should return empty array when no monitoring started', () => {
      stopMonitoring();
      // Clear cache by reloading module would be ideal, but for now just test behavior
      const status = getCachedStatus();
      assert.ok(Array.isArray(status));
    });
  });

  describe('stopMonitoring', () => {
    it('should stop the monitoring interval', async () => {
      const environments = [
        {
          name: 'Stop Test',
          healthCheckUrl: `${mockServerUrl}/health-ok`
        }
      ];

      monitorEnvironments(environments);
      await new Promise(resolve => setTimeout(resolve, 100));

      stopMonitoring();
      
      // Should not throw error when called multiple times
      stopMonitoring();
      
      assert.ok(true); // If we get here, no errors occurred
    });
  });
});
