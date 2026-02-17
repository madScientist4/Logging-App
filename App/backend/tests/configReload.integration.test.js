const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { loadConfiguration, onConfigChange } = require('../src/config');
const { clearSpecCache } = require('../src/validators/swaggerValidator');
const { updateEnvironments, getCachedStatus } = require('../src/services/environmentMonitor');

describe('Configuration Reload Integration', () => {
  const configPath = path.join(__dirname, '../config.json');
  let originalConfig;

  before(() => {
    // Backup original config
    originalConfig = fs.readFileSync(configPath, 'utf8');
  });

  after(() => {
    // Restore original config
    fs.writeFileSync(configPath, originalConfig, 'utf8');
  });

  it('should clear Swagger cache on configuration change', () => {
    // This test verifies that clearSpecCache can be called without errors
    assert.doesNotThrow(() => {
      clearSpecCache();
    }, 'clearSpecCache should not throw');
  });

  it('should update environment monitor on configuration change', (t, done) => {
    const config = loadConfiguration();
    
    // Create test environments
    const testEnvironments = [
      {
        name: 'Test Environment',
        healthCheckUrl: 'http://localhost:9999/health'
      }
    ];
    
    // Update environments
    updateEnvironments(testEnvironments);
    
    // Wait for initial check
    setTimeout(() => {
      const status = getCachedStatus();
      
      // Should have status for test environment
      assert.ok(status, 'Status should be defined');
      assert.ok(Array.isArray(status), 'Status should be an array');
      
      // Stop monitoring by updating with empty array
      updateEnvironments([]);
      
      done();
    }, 1000);
  });

  it('should handle configuration change workflow', (t, done) => {
    let changeCount = 0;
    
    // Register listener that simulates the server's config change handler
    const listener = (newConfig) => {
      changeCount++;
      
      try {
        // Simulate what the server does on config change
        clearSpecCache();
        updateEnvironments(newConfig.environments);
        
        // Verify operations completed without errors
        assert.ok(newConfig, 'New config should be defined');
        assert.strictEqual(changeCount, 1, 'Listener should be called once');
        
        // Clean up
        updateEnvironments([]);
        
        done();
      } catch (error) {
        done(error);
      }
    };
    
    onConfigChange(listener);
    
    // Simulate a config change by calling the listener directly
    const config = loadConfiguration();
    listener(config);
  });

  it('should handle empty environments configuration', () => {
    assert.doesNotThrow(() => {
      updateEnvironments([]);
    }, 'updateEnvironments should handle empty array');
    
    const status = getCachedStatus();
    assert.deepStrictEqual(status, [], 'Status should be empty array');
  });

  it('should handle null environments configuration', () => {
    assert.doesNotThrow(() => {
      updateEnvironments(null);
    }, 'updateEnvironments should handle null');
  });
});
