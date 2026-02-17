const { describe, it } = require('node:test');
const assert = require('node:assert');
const { loadConfiguration } = require('../src/config');

describe('Configuration Loading', () => {
  it('should load configuration from config.json and environment variables', () => {
    const config = loadConfiguration();
    
    assert.ok(config, 'Configuration should be loaded');
    assert.ok(config.server, 'Server config should exist');
    assert.ok(config.email, 'Email config should exist');
    assert.ok(config.swaggerSpecs, 'Swagger specs should exist');
    assert.ok(config.environments, 'Environments should exist');
  });

  it('should merge environment variables with config file', () => {
    const config = loadConfiguration();
    
    // These come from environment variables
    assert.ok(config.email.smtp.host, 'SMTP host from env var should be loaded');
    assert.ok(config.email.smtp.auth.user, 'SMTP user from env var should be loaded');
    assert.ok(config.email.from, 'Email from address from env var should be loaded');
    
    // These come from config.json
    assert.ok(config.email.teamEmails.length > 0, 'Team emails from config.json should be loaded');
    assert.ok(config.environments.length > 0, 'Environments from config.json should be loaded');
  });

  it('should parse port as number', () => {
    const config = loadConfiguration();
    assert.strictEqual(typeof config.server.port, 'number', 'Port should be a number');
  });

  it('should have default values', () => {
    const config = loadConfiguration();
    assert.ok(config.server.nodeEnv, 'Should have default node environment');
  });
});
