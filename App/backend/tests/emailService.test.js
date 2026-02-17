const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { formatEmailBody, sendNotificationEmail } = require('../src/services/emailService');

describe('Email Service', () => {
  describe('formatEmailBody', () => {
    test('should format email with all required fields', () => {
      const errorRequest = {
        endpoint: '/api/users/123',
        method: 'POST',
        payload: { name: 'John', email: 'john@example.com' },
        errorDescription: 'User creation failed with 500 error',
        timestamp: new Date('2024-01-15T10:30:00Z')
      };

      const result = formatEmailBody(errorRequest);

      assert.ok(result.includes('/api/users/123'), 'Should include endpoint');
      assert.ok(result.includes('POST'), 'Should include method');
      assert.ok(result.includes('User creation failed with 500 error'), 'Should include error description');
      assert.ok(result.includes('2024-01-15T10:30:00.000Z'), 'Should include timestamp');
      assert.ok(result.includes('"name": "John"'), 'Should include payload');
      assert.ok(result.includes('<!DOCTYPE html>'), 'Should be HTML format');
    });

    test('should format email with user contact information', () => {
      const errorRequest = {
        endpoint: '/api/products',
        method: 'GET',
        payload: {},
        errorDescription: 'Products endpoint not responding',
        userContact: 'alice@example.com',
        timestamp: new Date('2024-01-15T10:30:00Z')
      };

      const result = formatEmailBody(errorRequest);

      assert.ok(result.includes('alice@example.com'), 'Should include user contact');
      assert.ok(result.includes('User Contact:'), 'Should have user contact label');
    });

    test('should format email without user contact information', () => {
      const errorRequest = {
        endpoint: '/api/orders',
        method: 'DELETE',
        payload: { orderId: 456 },
        errorDescription: 'Order deletion failed',
        timestamp: new Date('2024-01-15T10:30:00Z')
      };

      const result = formatEmailBody(errorRequest);

      assert.ok(!result.includes('User Contact:'), 'Should not have user contact section');
      assert.ok(result.includes('/api/orders'), 'Should include endpoint');
    });

    test('should handle complex nested payload', () => {
      const errorRequest = {
        endpoint: '/api/complex',
        method: 'PUT',
        payload: {
          user: { id: 1, name: 'Test' },
          items: [{ id: 1 }, { id: 2 }],
          metadata: { source: 'web' }
        },
        errorDescription: 'Complex request failed',
        timestamp: new Date()
      };

      const result = formatEmailBody(errorRequest);

      assert.ok(result.includes('"user"'), 'Should include nested user object');
      assert.ok(result.includes('"items"'), 'Should include items array');
      assert.ok(result.includes('"metadata"'), 'Should include metadata');
    });

    test('should use current timestamp if not provided', () => {
      const errorRequest = {
        endpoint: '/api/test',
        method: 'GET',
        payload: {},
        errorDescription: 'Test error'
      };

      const result = formatEmailBody(errorRequest);

      // Should contain a valid ISO timestamp
      assert.ok(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result), 'Should include ISO timestamp');
    });
  });

  describe('sendNotificationEmail', () => {
    let originalEnv;

    beforeEach(() => {
      // Save original environment variables
      originalEnv = { ...process.env };
      
      // Set test environment variables
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_SECURE = 'false';
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'testpass';
      process.env.EMAIL_FROM = 'api-errors@test.com';
    });

    afterEach(() => {
      // Restore original environment variables
      process.env = originalEnv;
    });

    test('should return error when SMTP configuration is missing', async () => {
      // Remove SMTP configuration
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      const errorRequest = {
        endpoint: '/api/test',
        method: 'GET',
        payload: {},
        errorDescription: 'Test error',
        timestamp: new Date()
      };

      const result = await sendNotificationEmail(errorRequest, ['team@example.com']);

      assert.strictEqual(result.sent, false, 'Should fail without SMTP config');
      assert.ok(result.error, 'Should have error message');
    });

    test('should handle empty team emails array', async () => {
      const errorRequest = {
        endpoint: '/api/test',
        method: 'GET',
        payload: {},
        errorDescription: 'Test error',
        timestamp: new Date()
      };

      const result = await sendNotificationEmail(errorRequest, []);

      // Will fail because no recipients, but should not crash
      assert.strictEqual(result.sent, false, 'Should fail with no recipients');
    });
  });
});
