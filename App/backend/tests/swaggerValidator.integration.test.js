const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { loadSwaggerSpec, findOperation, validateAgainstSwagger } = require('../src/validators/swaggerValidator');

describe('Swagger Validator Integration Tests', () => {
  const sampleSpecPath = path.join(__dirname, 'fixtures', 'sample-swagger.json');

  describe('loadSwaggerSpec with local file', () => {
    it('should load and cache a valid Swagger spec', async () => {
      const spec = await loadSwaggerSpec(sampleSpecPath);
      
      assert.ok(spec, 'Spec should be loaded');
      assert.strictEqual(spec.openapi, '3.0.0', 'Should have correct OpenAPI version');
      assert.ok(spec.paths, 'Should have paths');
      assert.ok(spec.paths['/api/users'], 'Should have /api/users path');
    });

    it('should return cached spec on second call', async () => {
      const spec1 = await loadSwaggerSpec(sampleSpecPath);
      const spec2 = await loadSwaggerSpec(sampleSpecPath);
      
      // Should be the same object reference (cached)
      assert.strictEqual(spec1, spec2, 'Should return cached spec');
    });
  });

  describe('findOperation with loaded spec', () => {
    it('should find GET /api/users operation', async () => {
      const spec = await loadSwaggerSpec(sampleSpecPath);
      const result = findOperation(spec, '/api/users', 'GET');
      
      assert.ok(result, 'Should find operation');
      assert.strictEqual(result.operation.summary, 'Get all users', 'Should have correct summary');
    });

    it('should find POST /api/users operation', async () => {
      const spec = await loadSwaggerSpec(sampleSpecPath);
      const result = findOperation(spec, '/api/users', 'POST');
      
      assert.ok(result, 'Should find operation');
      assert.strictEqual(result.operation.summary, 'Create a user', 'Should have correct summary');
      assert.ok(result.operation.requestBody, 'Should have request body');
    });

    it('should find operation with path parameter', async () => {
      const spec = await loadSwaggerSpec(sampleSpecPath);
      const result = findOperation(spec, '/api/users/123', 'GET');
      
      assert.ok(result, 'Should find operation');
      assert.strictEqual(result.path, '/api/users/{id}', 'Should match parameterized path');
      assert.strictEqual(result.operation.summary, 'Get user by ID', 'Should have correct summary');
    });
  });

  describe('validateAgainstSwagger with complete workflow', () => {
    it('should validate a valid user creation request', async () => {
      const errorRequest = {
        endpoint: '/api/users',
        method: 'POST',
        payload: {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
          status: 'active'
        }
      };

      const config = {
        swaggerSpecs: [
          { pattern: '/api/users*', specUrl: sampleSpecPath }
        ]
      };

      const result = await validateAgainstSwagger(errorRequest, config);
      
      assert.strictEqual(result.isValid, true, 'Should be valid');
      assert.strictEqual(result.errors.length, 0, 'Should have no errors');
    });

    it('should detect missing required fields', async () => {
      const errorRequest = {
        endpoint: '/api/users',
        method: 'POST',
        payload: {
          name: 'John Doe'
          // Missing required 'email' field
        }
      };

      const config = {
        swaggerSpecs: [
          { pattern: '/api/users*', specUrl: sampleSpecPath }
        ]
      };

      const result = await validateAgainstSwagger(errorRequest, config);
      
      assert.strictEqual(result.isValid, false, 'Should be invalid');
      assert.ok(result.errors.length > 0, 'Should have errors');
      assert.ok(result.errors.some(e => e.includes('email')), 'Should mention missing email field');
    });

    it('should detect invalid field types', async () => {
      const errorRequest = {
        endpoint: '/api/users',
        method: 'POST',
        payload: {
          name: 'John Doe',
          email: 'john@example.com',
          age: 'thirty' // Should be integer
        }
      };

      const config = {
        swaggerSpecs: [
          { pattern: '/api/users*', specUrl: sampleSpecPath }
        ]
      };

      const result = await validateAgainstSwagger(errorRequest, config);
      
      assert.strictEqual(result.isValid, false, 'Should be invalid');
      assert.ok(result.errors.some(e => e.includes('age')), 'Should mention age field error');
    });

    it('should detect invalid enum values', async () => {
      const errorRequest = {
        endpoint: '/api/users',
        method: 'POST',
        payload: {
          name: 'John Doe',
          email: 'john@example.com',
          status: 'pending' // Not in enum [active, inactive]
        }
      };

      const config = {
        swaggerSpecs: [
          { pattern: '/api/users*', specUrl: sampleSpecPath }
        ]
      };

      const result = await validateAgainstSwagger(errorRequest, config);
      
      assert.strictEqual(result.isValid, false, 'Should be invalid');
      assert.ok(result.errors.some(e => e.includes('status')), 'Should mention status field error');
    });

    it('should detect invalid email format', async () => {
      const errorRequest = {
        endpoint: '/api/users',
        method: 'POST',
        payload: {
          name: 'John Doe',
          email: 'not-an-email' // Invalid email format
        }
      };

      const config = {
        swaggerSpecs: [
          { pattern: '/api/users*', specUrl: sampleSpecPath }
        ]
      };

      const result = await validateAgainstSwagger(errorRequest, config);
      
      assert.strictEqual(result.isValid, false, 'Should be invalid');
      assert.ok(result.errors.some(e => e.includes('email')), 'Should mention email field error');
    });

    it('should validate product creation with different schema', async () => {
      const errorRequest = {
        endpoint: '/api/products',
        method: 'POST',
        payload: {
          name: 'Widget',
          price: 29.99,
          category: 'Electronics'
        }
      };

      const config = {
        swaggerSpecs: [
          { pattern: '/api/products*', specUrl: sampleSpecPath }
        ]
      };

      const result = await validateAgainstSwagger(errorRequest, config);
      
      assert.strictEqual(result.isValid, true, 'Should be valid');
      assert.strictEqual(result.errors.length, 0, 'Should have no errors');
    });

    it('should handle endpoint not in specification', async () => {
      const errorRequest = {
        endpoint: '/api/orders',
        method: 'POST',
        payload: {}
      };

      const config = {
        swaggerSpecs: [
          { pattern: '/api/orders*', specUrl: sampleSpecPath }
        ]
      };

      const result = await validateAgainstSwagger(errorRequest, config);
      
      assert.strictEqual(result.isValid, false, 'Should be invalid');
      assert.ok(result.errors.some(e => e.includes('not found')), 'Should indicate endpoint not found');
    });

    it('should handle method not supported for endpoint', async () => {
      const errorRequest = {
        endpoint: '/api/users',
        method: 'DELETE', // Not defined in spec
        payload: {}
      };

      const config = {
        swaggerSpecs: [
          { pattern: '/api/users*', specUrl: sampleSpecPath }
        ]
      };

      const result = await validateAgainstSwagger(errorRequest, config);
      
      assert.strictEqual(result.isValid, false, 'Should be invalid');
      assert.ok(result.errors.some(e => e.includes('not found')), 'Should indicate method not found');
    });
  });
});
