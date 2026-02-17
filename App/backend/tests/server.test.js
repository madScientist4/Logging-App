const { describe, it, before } = require('node:test');
const assert = require('node:assert');

describe('Express Server Configuration', () => {
  let app, config;

  before(() => {
    // Load the server module
    const server = require('../src/server');
    app = server.app;
    config = server.config;
  });

  it('should load configuration successfully', () => {
    assert.ok(config, 'Configuration should be loaded');
    assert.ok(config.server, 'Server configuration should exist');
    assert.ok(config.email, 'Email configuration should exist');
    assert.ok(config.environments, 'Environments configuration should exist');
  });

  it('should have required server configuration', () => {
    assert.strictEqual(typeof config.server.port, 'number', 'Port should be a number');
    assert.ok(config.server.nodeEnv, 'Node environment should be set');
  });

  it('should have required email configuration', () => {
    assert.ok(config.email.smtp.host, 'SMTP host should be configured');
    assert.ok(config.email.smtp.auth.user, 'SMTP user should be configured');
    assert.ok(config.email.smtp.auth.pass, 'SMTP password should be configured');
    assert.ok(config.email.from, 'Email from address should be configured');
    assert.ok(Array.isArray(config.email.teamEmails), 'Team emails should be an array');
    assert.ok(config.email.teamEmails.length > 0, 'At least one team email should be configured');
  });

  it('should have Express app with middleware', () => {
    assert.ok(app, 'Express app should exist');
    assert.strictEqual(typeof app.listen, 'function', 'App should have listen method');
  });

  it('should have environments configuration', () => {
    assert.ok(Array.isArray(config.environments), 'Environments should be an array');
    if (config.environments.length > 0) {
      const env = config.environments[0];
      assert.ok(env.name, 'Environment should have a name');
      assert.ok(env.healthCheckUrl, 'Environment should have a health check URL');
    }
  });
});
