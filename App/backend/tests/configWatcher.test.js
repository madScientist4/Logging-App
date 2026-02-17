const { describe, it, before, after, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { loadConfiguration, watchConfigFile, onConfigChange, getCurrentConfig } = require('../src/config');

describe('Configuration File Watching', () => {
  const configPath = path.join(__dirname, '../config.json');
  let originalConfig;
  let watcher;

  before(() => {
    // Backup original config
    originalConfig = fs.readFileSync(configPath, 'utf8');
  });

  after(() => {
    // Restore original config
    fs.writeFileSync(configPath, originalConfig, 'utf8');
    
    // Close watcher if still open
    if (watcher) {
      watcher.close();
    }
  });

  afterEach(() => {
    // Close watcher after each test
    if (watcher) {
      watcher.close();
      watcher = null;
    }
  });

  it('should load initial configuration', () => {
    const config = loadConfiguration();
    
    assert.ok(config, 'Configuration should be defined');
    assert.ok(config.swaggerSpecs, 'Swagger specs should be defined');
    assert.ok(config.email, 'Email config should be defined');
    assert.ok(config.environments, 'Environments should be defined');
  });

  it('should register configuration change listeners', () => {
    let listenerCalled = false;
    const listener = () => { listenerCalled = true; };
    
    onConfigChange(listener);
    
    // Listener should be registered but not called yet
    assert.strictEqual(listenerCalled, false, 'Listener should not be called on registration');
  });

  it('should reload configuration when file changes', (t, done) => {
    // Load initial configuration
    const initialConfig = loadConfiguration();
    
    // Register listener for config changes
    let listenerCallCount = 0;
    const listener = (newConfig) => {
      listenerCallCount++;
      
      try {
        // Verify listener was called with new config
        assert.strictEqual(listenerCallCount, 1, 'Listener should be called once');
        assert.ok(newConfig, 'New config should be defined');
        assert.ok(newConfig.swaggerSpecs, 'Swagger specs should be defined');
        
        // Verify config was actually reloaded
        const currentConfig = getCurrentConfig();
        assert.deepStrictEqual(currentConfig, newConfig, 'Current config should match new config');
        
        done();
      } catch (error) {
        done(error);
      }
    };
    
    onConfigChange(listener);
    
    // Start watching
    watcher = watchConfigFile();
    
    // Wait a bit for watcher to initialize
    setTimeout(() => {
      // Modify config file (add a comment to trigger change)
      const currentContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(currentContent);
      
      // Make a small change
      config._testTimestamp = Date.now();
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    }, 100);
  });

  it('should handle configuration reload errors gracefully', (t, done) => {
    // Start watching
    watcher = watchConfigFile();
    
    // Wait a bit for watcher to initialize
    setTimeout(() => {
      // Write invalid JSON to trigger error
      fs.writeFileSync(configPath, '{ invalid json }', 'utf8');
      
      // Wait for error to be logged
      setTimeout(() => {
        // Restore valid config
        fs.writeFileSync(configPath, originalConfig, 'utf8');
        
        // Test passes if we get here without crashing
        done();
      }, 500);
    }, 100);
  });

  it('should return current cached configuration', () => {
    loadConfiguration();
    
    const currentConfig = getCurrentConfig();
    
    assert.ok(currentConfig, 'Current config should be defined');
    assert.ok(currentConfig.swaggerSpecs, 'Swagger specs should be defined');
    assert.ok(currentConfig.email, 'Email config should be defined');
    assert.ok(currentConfig.environments, 'Environments should be defined');
  });
});
