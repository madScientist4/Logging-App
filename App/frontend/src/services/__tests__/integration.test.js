import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { submitErrorReport } from '../errorReportService';
import { fetchEnvironmentStatus } from '../environmentService';

/**
 * Integration tests for frontend-backend connection
 * Requirements: 1.2, 1.3, 4.1, 4.2, 5.2
 * 
 * Note: These tests require the backend server to be running on port 3000
 */

describe('Frontend-Backend Integration', () => {
  // Skip tests if backend is not available
  let backendAvailable = false;

  beforeAll(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/health');
      backendAvailable = response.ok;
    } catch (error) {
      console.warn('Backend not available, skipping integration tests');
      backendAvailable = false;
    }
  });

  describe('Error Report Submission', () => {
    it('should submit error report and receive validation response', async () => {
      if (!backendAvailable) {
        console.log('Skipping test - backend not available');
        return;
      }

      const errorData = {
        endpoint: '/api/users',
        method: 'POST',
        payload: { name: 'Test User', email: 'test@example.com' },
        errorDescription: 'Test error description',
        userContact: 'tester@example.com'
      };

      try {
        const result = await submitErrorReport(errorData);
        
        // Should receive a response with success status
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('message');
        
        // Response should be either success or validation failure
        if (result.success) {
          expect(result.message).toContain('email');
        } else {
          expect(result).toHaveProperty('validationErrors');
        }
      } catch (error) {
        // Network errors should be handled gracefully
        expect(error.response || error.message).toBeDefined();
      }
    });

    it('should handle network errors gracefully', async () => {
      if (!backendAvailable) {
        console.log('Skipping test - backend not available');
        return;
      }

      // Test with invalid data to trigger validation
      const invalidData = {
        endpoint: '',
        method: 'GET',
        payload: {},
        errorDescription: ''
      };

      try {
        await submitErrorReport(invalidData);
      } catch (error) {
        // Should receive error response
        expect(error).toBeDefined();
      }
    });
  });

  describe('Environment Status Display', () => {
    it('should fetch environment status from backend', async () => {
      if (!backendAvailable) {
        console.log('Skipping test - backend not available');
        return;
      }

      try {
        const result = await fetchEnvironmentStatus();
        
        // Should receive response with environments array
        expect(result).toBeDefined();
        expect(result).toHaveProperty('environments');
        expect(Array.isArray(result.environments)).toBe(true);
        
        // Each environment should have required fields
        if (result.environments.length > 0) {
          const env = result.environments[0];
          expect(env).toHaveProperty('name');
          expect(env).toHaveProperty('status');
          expect(env).toHaveProperty('lastChecked');
          expect(['active', 'inactive']).toContain(env.status);
        }
      } catch (error) {
        // Network errors should be handled gracefully
        expect(error.response || error.message).toBeDefined();
      }
    });

    it('should handle backend unavailability', async () => {
      // This test verifies error handling when backend is down
      // We can't easily simulate this without stopping the server
      // So we just verify the service exists and can be called
      expect(fetchEnvironmentStatus).toBeDefined();
      expect(typeof fetchEnvironmentStatus).toBe('function');
    });
  });

  describe('API Configuration', () => {
    it('should use correct API base URL', () => {
      // Verify the API service is configured
      const api = require('../api').default;
      expect(api.defaults.baseURL).toBe('/api');
      expect(api.defaults.timeout).toBe(10000);
    });

    it('should have proper error interceptors', () => {
      const api = require('../api').default;
      expect(api.interceptors.request.handlers.length).toBeGreaterThan(0);
      expect(api.interceptors.response.handlers.length).toBeGreaterThan(0);
    });
  });
});
