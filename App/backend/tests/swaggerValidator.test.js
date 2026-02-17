const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { loadSwaggerSpec, findOperation, validateAgainstSwagger } = require('../src/validators/swaggerValidator');

describe('Swagger Validator', () => {
  describe('loadSwaggerSpec', () => {
    it('should throw error for invalid spec URL', async () => {
      await assert.rejects(
        async () => await loadSwaggerSpec('https://invalid-url-that-does-not-exist.com/spec.json'),
        /Failed to load Swagger specification/,
        'Should throw error for invalid URL'
      );
    });
  });

  describe('findOperation', () => {
    it('should return null for empty spec', () => {
      const result = findOperation(null, '/api/users', 'GET');
      assert.strictEqual(result, null, 'Should return null for null spec');
    });

    it('should return null for spec without paths', () => {
      const spec = { openapi: '3.0.0' };
      const result = findOperation(spec, '/api/users', 'GET');
      assert.strictEqual(result, null, 'Should return null for spec without paths');
    });

    it('should find exact path match', () => {
      const spec = {
        paths: {
          '/api/users': {
            get: {
              summary: 'Get users',
              responses: { '200': { description: 'Success' } }
            }
          }
        }
      };
      
      const result = findOperation(spec, '/api/users', 'GET');
      assert.ok(result, 'Should find operation');
      assert.strictEqual(result.path, '/api/users', 'Should return correct path');
      assert.strictEqual(result.operation.summary, 'Get users', 'Should return correct operation');
    });

    it('should find path with parameters', () => {
      const spec = {
        paths: {
          '/api/users/{id}': {
            get: {
              summary: 'Get user by ID',
              responses: { '200': { description: 'Success' } }
            }
          }
        }
      };
      
      const result = findOperation(spec, '/api/users/123', 'GET');
      assert.ok(result, 'Should find operation with path parameter');
      assert.strictEqual(result.path, '/api/users/{id}', 'Should return pattern path');
      assert.strictEqual(result.operation.summary, 'Get user by ID', 'Should return correct operation');
    });

    it('should return null for non-existent endpoint', () => {
      const spec = {
        paths: {
          '/api/users': {
            get: { summary: 'Get users' }
          }
        }
      };
      
      const result = findOperation(spec, '/api/products', 'GET');
      assert.strictEqual(result, null, 'Should return null for non-existent endpoint');
    });

    it('should return null for non-existent method', () => {
      const spec = {
        paths: {
          '/api/users': {
            get: { summary: 'Get users' }
          }
        }
      };
      
      const result = findOperation(spec, '/api/users', 'POST');
      assert.strictEqual(result, null, 'Should return null for non-existent method');
    });

    it('should handle case-insensitive HTTP methods', () => {
      const spec = {
        paths: {
          '/api/users': {
            post: { summary: 'Create user' }
          }
        }
      };
      
      const result = findOperation(spec, '/api/users', 'POST');
      assert.ok(result, 'Should find operation with uppercase method');
      assert.strictEqual(result.operation.summary, 'Create user', 'Should return correct operation');
    });
  });

  describe('validateAgainstSwagger', () => {
    it('should return error when no spec found for endpoint', async () => {
      const errorRequest = {
        endpoint: '/api/unknown',
        method: 'GET',
        payload: {}
      };
      
      const config = {
        swaggerSpecs: [
          { pattern: '/api/users/*', specUrl: 'http://example.com/spec.json' }
        ]
      };
      
      const result = await validateAgainstSwagger(errorRequest, config);
      assert.strictEqual(result.isValid, false, 'Should be invalid');
      assert.ok(result.errors.length > 0, 'Should have errors');
      assert.ok(result.errors[0].includes('not found'), 'Should indicate spec not found');
    });

    it('should handle missing swaggerSpecs in config', async () => {
      const errorRequest = {
        endpoint: '/api/users',
        method: 'GET',
        payload: {}
      };
      
      const config = {};
      
      const result = await validateAgainstSwagger(errorRequest, config);
      assert.strictEqual(result.isValid, false, 'Should be invalid');
      assert.ok(result.errors.length > 0, 'Should have errors');
    });

    it('should match endpoint patterns with wildcards', async () => {
      const errorRequest = {
        endpoint: '/api/users/123',
        method: 'GET',
        payload: {}
      };
      
      const config = {
        swaggerSpecs: [
          { pattern: '/api/users/*', specUrl: 'https://invalid-url.com/spec.json' }
        ]
      };
      
      const result = await validateAgainstSwagger(errorRequest, config);
      // Should find the spec (even though loading will fail)
      assert.ok(result.errors[0].includes('Invalid API specification format'), 
        'Should attempt to load spec for matching pattern');
    });
  });
});
