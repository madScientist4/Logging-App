const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Current configuration cache
let currentConfig = null;

// Configuration change listeners
const configChangeListeners = [];

/**
 * Load and validate application configuration
 * Merges config.json with environment variables
 */
function loadConfiguration() {
  const configPath = path.join(__dirname, '../../config.json');
  
  // Read config.json
  let config;
  try {
    const configFile = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configFile);
  } catch (error) {
    throw new Error(`Failed to load config.json: ${error.message}`);
  }

  // Merge with environment variables
  const fullConfig = {
    server: {
      port: process.env.PORT || 3000,
      nodeEnv: process.env.NODE_ENV || 'development'
    },
    swaggerSpecs: config.swaggerSpecs || [],
    email: {
      smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      },
      from: process.env.EMAIL_FROM,
      teamEmails: config.email?.teamEmails || []
    },
    environments: config.environments || []
  };

  // Validate required configuration
  validateConfiguration(fullConfig);

  // Update current config cache
  currentConfig = fullConfig;

  return fullConfig;
}

/**
 * Validate that required configuration values are present
 */
function validateConfiguration(config) {
  const errors = [];

  if (!config.server.port) {
    errors.push('Server port is required');
  }

  if (!config.email.smtp.host) {
    errors.push('SMTP_HOST is required');
  }

  if (!config.email.smtp.auth.user) {
    errors.push('SMTP_USER is required');
  }

  if (!config.email.smtp.auth.pass) {
    errors.push('SMTP_PASS is required');
  }

  if (!config.email.from) {
    errors.push('EMAIL_FROM is required');
  }

  if (!config.email.teamEmails || config.email.teamEmails.length === 0) {
    errors.push('At least one team email is required in config.json');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Register a listener for configuration changes
 * @param {Function} listener - Callback function to invoke when config changes
 */
function onConfigChange(listener) {
  if (typeof listener === 'function') {
    configChangeListeners.push(listener);
  }
}

/**
 * Notify all registered listeners of configuration change
 * @param {Object} newConfig - The newly loaded configuration
 */
function notifyConfigChange(newConfig) {
  configChangeListeners.forEach(listener => {
    try {
      listener(newConfig);
    } catch (error) {
      console.error('Error in config change listener:', error.message);
    }
  });
}

/**
 * Watch configuration file for changes and reload when modified
 * @returns {fs.FSWatcher} File watcher instance
 */
function watchConfigFile() {
  const configPath = path.join(__dirname, '../../config.json');
  
  console.log('Starting configuration file watcher...');
  
  const watcher = fs.watch(configPath, (eventType, filename) => {
    if (eventType === 'change') {
      console.log(`Configuration file changed, reloading...`);
      
      try {
        // Reload configuration
        const newConfig = loadConfiguration();
        
        // Notify all listeners
        notifyConfigChange(newConfig);
        
        console.log('Configuration reloaded successfully');
      } catch (error) {
        console.error('Failed to reload configuration:', error.message);
      }
    }
  });

  watcher.on('error', (error) => {
    console.error('Configuration file watcher error:', error.message);
  });

  return watcher;
}

/**
 * Get the current cached configuration
 * @returns {Object} Current configuration
 */
function getCurrentConfig() {
  return currentConfig;
}

module.exports = { 
  loadConfiguration, 
  watchConfigFile, 
  onConfigChange,
  getCurrentConfig
};
