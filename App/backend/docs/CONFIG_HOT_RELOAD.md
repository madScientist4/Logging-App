# Configuration Hot-Reload

The API Error Logger supports hot-reloading of configuration without requiring application redeployment. This feature allows system administrators to update configuration settings on-the-fly.

## Overview

When the `config.json` file is modified, the application automatically:
1. Detects the file change
2. Reloads and validates the new configuration
3. Updates all affected services
4. Logs the reload event

## What Gets Reloaded

### Swagger Specifications
- The Swagger validator cache is cleared
- New Swagger spec URLs are loaded on next validation request
- Existing cached specs are discarded to ensure fresh data

### Environment Monitoring
- Environment monitoring is stopped
- Status cache is cleared
- Monitoring restarts with new environment list
- Health checks begin immediately for new environments

### Email Configuration
- Team email addresses are updated
- Email templates use new configuration on next send
- Note: SMTP settings from environment variables are NOT reloaded (requires restart)

## Configuration File Structure

```json
{
  "swaggerSpecs": [
    {
      "pattern": "/api/users/*",
      "specUrl": "https://api.example.com/swagger/users.json"
    }
  ],
  "email": {
    "teamEmails": [
      "team@example.com"
    ]
  },
  "environments": [
    {
      "name": "Production",
      "healthCheckUrl": "https://api.prod.example.com/health"
    }
  ]
}
```

## How It Works

### File Watching
The application uses Node.js `fs.watch()` to monitor `config.json` for changes:

```javascript
const watcher = fs.watch(configPath, (eventType, filename) => {
  if (eventType === 'change') {
    // Reload configuration
    const newConfig = loadConfiguration();
    
    // Notify all listeners
    notifyConfigChange(newConfig);
  }
});
```

### Service Updates
When configuration changes, registered listeners are notified:

```javascript
onConfigChange((newConfig) => {
  // Update app.locals.config for routes
  app.locals.config = newConfig;
  
  // Clear Swagger validator cache
  clearSpecCache();
  
  // Update environment monitor configuration
  updateEnvironments(newConfig.environments);
});
```

## Usage Examples

### Adding a New Swagger Specification

1. Edit `config.json`:
```json
{
  "swaggerSpecs": [
    {
      "pattern": "/api/users/*",
      "specUrl": "https://api.example.com/swagger/users.json"
    },
    {
      "pattern": "/api/orders/*",
      "specUrl": "https://api.example.com/swagger/orders.json"
    }
  ]
}
```

2. Save the file
3. Check server logs:
```
Configuration file changed, reloading...
Configuration reloaded successfully
Configuration change detected, updating services...
Cleared Swagger specification cache (2 specs)
All services updated with new configuration
```

### Updating Environment List

1. Edit `config.json`:
```json
{
  "environments": [
    {
      "name": "Production",
      "healthCheckUrl": "https://api.prod.example.com/health"
    },
    {
      "name": "Staging",
      "healthCheckUrl": "https://api.staging.example.com/health"
    },
    {
      "name": "QA",
      "healthCheckUrl": "https://api.qa.example.com/health"
    }
  ]
}
```

2. Save the file
3. Environment monitoring automatically restarts with new list

### Updating Team Email Addresses

1. Edit `config.json`:
```json
{
  "email": {
    "teamEmails": [
      "team@example.com",
      "investigation@example.com",
      "alerts@example.com"
    ]
  }
}
```

2. Save the file
3. New error reports will be sent to all three addresses

## Error Handling

### Invalid JSON
If the configuration file contains invalid JSON:
- Error is logged: `Failed to reload configuration: Unexpected token...`
- Previous configuration remains active
- Application continues running with old config

### Validation Errors
If the new configuration fails validation:
- Error is logged with specific validation failures
- Previous configuration remains active
- Application continues running with old config

### File System Errors
If the file watcher encounters an error:
- Error is logged: `Configuration file watcher error: ...`
- Watcher may need to be restarted
- Application continues running

## Testing

### Manual Testing
Use the provided manual verification script:

```bash
node tests/manual-verify-config-watch.js
```

Then modify `config.json` to see hot-reload in action.

### Automated Tests
Run the configuration watcher tests:

```bash
npm test tests/configWatcher.test.js
npm test tests/configReload.integration.test.js
```

## Limitations

### What Does NOT Get Reloaded

The following settings require an application restart:
- **SMTP credentials** (from environment variables)
- **Server port** (from environment variables)
- **Node environment** (from environment variables)

These are loaded from environment variables at startup and cannot be changed without restarting the application.

### File System Limitations

- File watching may not work reliably on network file systems
- Some text editors create temporary files that may trigger multiple reload events
- Rapid successive changes may cause multiple reloads

## Best Practices

1. **Test configuration changes** in a development environment first
2. **Make atomic changes** - save the file once with all changes
3. **Monitor logs** after configuration changes to verify successful reload
4. **Keep backups** of working configurations
5. **Use version control** for configuration files

## Troubleshooting

### Configuration not reloading
- Check file permissions on `config.json`
- Verify the file path is correct
- Check server logs for error messages
- Ensure the file is being saved (not just modified in editor)

### Services not updating
- Check that configuration change listeners are registered
- Verify the new configuration is valid JSON
- Check for validation errors in logs

### Multiple reload events
- Some editors create temporary files when saving
- This is normal and harmless - the latest config will be used
- Consider using atomic file operations if this is problematic

## Implementation Details

### Module: `src/config/index.js`
- `loadConfiguration()` - Loads and validates configuration
- `watchConfigFile()` - Starts file watcher
- `onConfigChange(listener)` - Registers change listener
- `getCurrentConfig()` - Returns current cached config

### Module: `src/validators/swaggerValidator.js`
- `clearSpecCache()` - Clears cached Swagger specifications

### Module: `src/services/environmentMonitor.js`
- `updateEnvironments(environments)` - Updates monitoring configuration

## Related Requirements

This feature implements **Requirement 7.5**:
> WHEN configuration changes are made, THE System SHALL apply them without requiring application redeployment
