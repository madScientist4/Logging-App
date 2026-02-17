const express = require('express');
const cors = require('cors');
const { loadConfiguration, watchConfigFile, onConfigChange } = require('./config');
const errorHandler = require('./middleware/errorHandler');
const requestIdMiddleware = require('./middleware/requestId');
const healthRouter = require('./routes/health');
const errorReportsRouter = require('./routes/errorReports');
const environmentsRouter = require('./routes/environments');
const { monitorEnvironments, updateEnvironments } = require('./services/environmentMonitor');
const { clearSpecCache } = require('./validators/swaggerValidator');
const { log, LogLevel, logConfigurationReload } = require('./utils/logger');

// Load configuration
let config;
try {
  config = loadConfiguration();
  logConfigurationReload('startup', true);
} catch (error) {
  logConfigurationReload('startup', false, error.message);
  process.exit(1);
}

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestIdMiddleware); // Add request ID to all requests

// Make config available to routes
app.locals.config = config;

// Routes
app.use('/api', healthRouter);
app.use('/api', errorReportsRouter);
app.use('/api', environmentsRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  log(LogLevel.INFO, 'Server started', {
    event: 'server_start',
    port: PORT,
    environment: config.server.nodeEnv
  });
  
  // Start environment monitoring on server startup
  if (config.environments && config.environments.length > 0) {
    monitorEnvironments(config.environments);
  } else {
    log(LogLevel.WARN, 'No environments configured for monitoring', {
      event: 'monitoring_config_warning'
    });
  }
  
  // Register configuration change listeners
  onConfigChange((newConfig) => {
    logConfigurationReload('file_change', true);
    
    // Update app.locals.config for routes
    app.locals.config = newConfig;
    
    // Clear Swagger validator cache
    clearSpecCache();
    
    // Update environment monitor configuration
    updateEnvironments(newConfig.environments);
  });
  
  // Start configuration file watcher
  watchConfigFile();
});

// Export for testing
module.exports = { app, config };
