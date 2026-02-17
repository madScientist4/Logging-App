/**
 * Manual verification script for configuration file watching
 * 
 * This script demonstrates the configuration hot-reload functionality.
 * Run this script and then modify config.json to see the reload in action.
 * 
 * Usage: node tests/manual-verify-config-watch.js
 */

const { loadConfiguration, watchConfigFile, onConfigChange } = require('../src/config');
const { clearSpecCache } = require('../src/validators/swaggerValidator');
const { updateEnvironments } = require('../src/services/environmentMonitor');

console.log('=== Configuration File Watching Demo ===\n');

// Load initial configuration
console.log('Loading initial configuration...');
const config = loadConfiguration();
console.log('Initial configuration loaded:');
console.log(`  - Swagger specs: ${config.swaggerSpecs.length}`);
console.log(`  - Team emails: ${config.email.teamEmails.length}`);
console.log(`  - Environments: ${config.environments.length}`);
console.log();

// Register configuration change listener
console.log('Registering configuration change listener...');
onConfigChange((newConfig) => {
  console.log('\n🔄 Configuration change detected!');
  console.log('New configuration:');
  console.log(`  - Swagger specs: ${newConfig.swaggerSpecs.length}`);
  console.log(`  - Team emails: ${newConfig.email.teamEmails.length}`);
  console.log(`  - Environments: ${newConfig.environments.length}`);
  
  // Simulate what the server does
  console.log('\nUpdating services...');
  clearSpecCache();
  updateEnvironments(newConfig.environments);
  console.log('✅ All services updated with new configuration\n');
});

// Start watching configuration file
console.log('Starting configuration file watcher...');
const watcher = watchConfigFile();
console.log('✅ Configuration file watcher started\n');

console.log('📝 Now modify config.json to see the hot-reload in action!');
console.log('   (Press Ctrl+C to exit)\n');

// Keep the script running
process.on('SIGINT', () => {
  console.log('\n\nStopping configuration watcher...');
  watcher.close();
  updateEnvironments([]); // Stop environment monitoring
  console.log('✅ Cleanup complete. Goodbye!');
  process.exit(0);
});
