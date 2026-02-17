const https = require('https');
const http = require('http');
const { URL } = require('url');
const { logEnvironmentStatusChange, logEnvironmentHealthCheck, log, LogLevel } = require('../utils/logger');

/**
 * Environment Monitor Service
 * Monitors API environment health status with scheduled checks
 */

// Cache for environment status
let statusCache = [];

// Monitoring interval reference
let monitoringInterval = null;

/**
 * Make HTTP/HTTPS request with timeout
 * @param {string} url - URL to request
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Object>} Response object
 */
function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = protocol.get(url, { timeout }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve({ statusCode: res.statusCode });
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
      // Consume response data to free up memory
      res.resume();
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Check the operational status of a single environment
 * @param {Object} environment - Environment configuration {name, healthCheckUrl}
 * @returns {Object} Status object {name, status, lastChecked}
 */
async function checkEnvironmentStatus(environment) {
  const { name, healthCheckUrl } = environment;
  const timestamp = new Date().toISOString();

  try {
    // Send health check request with 5-second timeout
    await makeRequest(healthCheckUrl, 5000);

    logEnvironmentHealthCheck(name, 'active');
    
    return {
      name,
      status: 'active',
      lastChecked: timestamp
    };
  } catch (error) {
    // Mark as inactive on timeout or error
    logEnvironmentHealthCheck(name, 'inactive', error.message);
    
    return {
      name,
      status: 'inactive',
      lastChecked: timestamp
    };
  }
}

/**
 * Monitor all configured environments with scheduled checks
 * Runs continuously in the background, updating cache every 60 seconds
 * @param {Array} environments - Array of environment configurations
 */
function monitorEnvironments(environments) {
  if (!environments || environments.length === 0) {
    log(LogLevel.WARN, 'No environments configured for monitoring', {
      event: 'monitoring_start_warning'
    });
    return;
  }

  // Perform initial check immediately
  performHealthChecks(environments);

  // Schedule periodic checks every 60 seconds
  monitoringInterval = setInterval(() => {
    performHealthChecks(environments);
  }, 60000);

  log(LogLevel.INFO, 'Environment monitoring started', {
    event: 'monitoring_start',
    environmentCount: environments.length
  });
}

/**
 * Perform health checks for all environments and update cache
 * @param {Array} environments - Array of environment configurations
 */
async function performHealthChecks(environments) {
  try {
    // Store previous status for change detection
    const previousStatus = new Map(statusCache.map(env => [env.name, env.status]));
    
    // Check all environments in parallel
    const statusPromises = environments.map(env => checkEnvironmentStatus(env));
    const results = await Promise.all(statusPromises);

    // Update cache with results
    statusCache = results;

    // Log status changes
    results.forEach(result => {
      const prevStatus = previousStatus.get(result.name);
      if (prevStatus && prevStatus !== result.status) {
        logEnvironmentStatusChange(result.name, prevStatus, result.status);
      }
    });

    const activeCount = results.filter(r => r.status === 'active').length;
    const inactiveCount = results.filter(r => r.status === 'inactive').length;
    
    log(LogLevel.INFO, 'Environment health check completed', {
      event: 'health_check_completed',
      activeCount,
      inactiveCount,
      totalCount: results.length
    });
  } catch (error) {
    log(LogLevel.ERROR, 'Error during environment health checks', {
      event: 'health_check_error',
      error: error.message
    });
  }
}

/**
 * Retrieve the current cached environment status
 * @returns {Array} Array of environment status objects
 */
function getCachedStatus() {
  return statusCache;
}

/**
 * Stop the environment monitoring service
 * Used for cleanup during shutdown or testing
 */
function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    log(LogLevel.INFO, 'Environment monitoring stopped', {
      event: 'monitoring_stop'
    });
  }
}

/**
 * Update environment monitoring configuration
 * Stops current monitoring and restarts with new configuration
 * @param {Array} environments - New array of environment configurations
 */
function updateEnvironments(environments) {
  log(LogLevel.INFO, 'Updating environment monitoring configuration', {
    event: 'monitoring_config_update',
    environmentCount: environments?.length || 0
  });
  
  // Stop current monitoring
  stopMonitoring();
  
  // Clear status cache
  statusCache = [];
  
  // Start monitoring with new configuration
  if (environments && environments.length > 0) {
    monitorEnvironments(environments);
  } else {
    log(LogLevel.WARN, 'No environments configured for monitoring', {
      event: 'monitoring_config_warning'
    });
  }
}

module.exports = {
  checkEnvironmentStatus,
  monitorEnvironments,
  getCachedStatus,
  stopMonitoring,
  updateEnvironments
};
