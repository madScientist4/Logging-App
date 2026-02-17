# Configuration Guide

This document provides detailed information about configuring the API Error Logger application.

## Configuration Overview

The application uses two configuration sources:

1. **config.json** - Application settings (non-sensitive)
2. **Environment variables (.env)** - Sensitive credentials

Configuration changes in `config.json` are automatically detected and applied without restarting the server (hot-reload). Changes to environment variables require a server restart.

## Configuration File (config.json)

### Location

`backend/config.json`

### Format

The configuration file uses JSON format with three main sections:

```json
{
  "swaggerSpecs": [...],
  "email": {...},
  "environments": [...]
}
```

### Swagger Specifications

The `swaggerSpecs` array defines mappings between API endpoints and their OpenAPI/Swagger specification files.

```json
{
  "swaggerSpecs": [
    {
      "pattern": "/api/users/*",
      "specUrl": "https://api.example.com/swagger/users.json"
    },
    {
      "pattern": "/api/products/*",
      "specUrl": "https://api.example.com/swagger/products.json"
    },
    {
      "pattern": "/api/orders/*",
      "specUrl": "https://api.example.com/swagger/orders.json"
    }
  ]
}
```

**Fields:**

- `pattern` (string, required): URL pattern to match
  - Supports wildcard matching with `*`
  - Examples:
    - `/api/users/*` matches `/api/users/123`, `/api/users/create`, etc.
    - `/api/v1/*` matches all endpoints under `/api/v1/`
    - `/api/products/*/reviews` matches `/api/products/123/reviews`
  - Patterns are matched in order; first match wins

- `specUrl` (string, required): URL to the OpenAPI/Swagger specification
  - Must be a valid HTTP/HTTPS URL
  - Supports OpenAPI 3.0 and Swagger 2.0
  - Can be JSON or YAML format
  - Specifications are cached after first load

**Best Practices:**

- Order patterns from most specific to least specific
- Use separate specifications for different API sections
- Keep specifications up to date with API changes
- Use version control for specification files

### Email Configuration

The `email` section defines recipients for error notifications.

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

**Fields:**

- `teamEmails` (array of strings, required): Email addresses of investigation team members
  - All addresses receive notifications for validated error reports
  - Must be valid email addresses
  - No limit on number of recipients

**Best Practices:**

- Use distribution lists or group emails when possible
- Include backup contacts for redundancy
- Test email delivery after adding new addresses
- Document who each email address represents

### Environment Monitoring

The `environments` array defines API environments to monitor.

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
      "name": "Development",
      "healthCheckUrl": "https://api.dev.example.com/health"
    }
  ]
}
```

**Fields:**

- `name` (string, required): Display name for the environment
  - Shown in the frontend dashboard
  - Should be descriptive and concise
  - Examples: "Production", "Staging", "Development", "QA", "UAT"

- `healthCheckUrl` (string, required): URL to check environment availability
  - Must be a valid HTTP/HTTPS URL
  - Should return 2xx status code when healthy
  - Timeout is 5 seconds
  - Checked every 60 seconds

**Best Practices:**

- Use dedicated health check endpoints
- Ensure health checks are lightweight (fast response)
- Monitor all environments users might report errors from
- Use consistent naming across environments

### Complete Example

```json
{
  "swaggerSpecs": [
    {
      "pattern": "/api/v1/users/*",
      "specUrl": "https://api.example.com/specs/users-v1.json"
    },
    {
      "pattern": "/api/v1/products/*",
      "specUrl": "https://api.example.com/specs/products-v1.json"
    },
    {
      "pattern": "/api/v2/*",
      "specUrl": "https://api.example.com/specs/api-v2.yaml"
    }
  ],
  "email": {
    "teamEmails": [
      "api-team@example.com",
      "devops@example.com"
    ]
  },
  "environments": [
    {
      "name": "Production US",
      "healthCheckUrl": "https://api-us.prod.example.com/health"
    },
    {
      "name": "Production EU",
      "healthCheckUrl": "https://api-eu.prod.example.com/health"
    },
    {
      "name": "Staging",
      "healthCheckUrl": "https://api.staging.example.com/health"
    },
    {
      "name": "Development",
      "healthCheckUrl": "https://api.dev.example.com/health"
    }
  ]
}
```

## Environment Variables (.env)

### Location

`backend/.env`

### Format

Environment variables use KEY=VALUE format:

```bash
# Comments start with #
NODE_ENV=development
PORT=3000
```

### Required Variables

#### SMTP Configuration

**SMTP_HOST** (required)
- SMTP server hostname
- Example: `smtp.gmail.com`, `smtp.office365.com`, `smtp.sendgrid.net`

**SMTP_PORT** (required)
- SMTP server port
- Common values:
  - `587` - TLS/STARTTLS (recommended)
  - `465` - SSL
  - `25` - Unencrypted (not recommended)

**SMTP_SECURE** (optional, default: false)
- Use SSL/TLS connection
- Values: `true` or `false`
- Use `true` for port 465, `false` for port 587

**SMTP_USER** (required)
- SMTP authentication username
- Usually your email address

**SMTP_PASS** (required)
- SMTP authentication password
- For Gmail with 2FA, use an App Password
- Keep this secret and never commit to version control

**EMAIL_FROM** (required)
- Sender email address for notifications
- Must be authorized to send from your SMTP server
- Example: `api-errors@example.com`

#### Server Configuration

**NODE_ENV** (optional, default: development)
- Application environment
- Values: `development`, `production`, `staging`
- Affects logging verbosity and error handling

**PORT** (optional, default: 3000)
- Port number for the backend server
- Must be available and not in use by another application

### Example .env File

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# SMTP Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Settings
EMAIL_FROM=api-errors@example.com
```

### Provider-Specific Examples

#### Gmail

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Generate at https://myaccount.google.com/apppasswords
EMAIL_FROM=your-email@gmail.com
```

**Note:** Gmail requires an App Password if 2-factor authentication is enabled.

#### Office 365 / Outlook

```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
EMAIL_FROM=your-email@outlook.com
```

#### SendGrid

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=verified-sender@example.com
```

#### AWS SES

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
EMAIL_FROM=verified-sender@example.com
```

**Note:** AWS SES requires email address verification.

## Configuration Hot-Reload

The application monitors `config.json` for changes and automatically reloads configuration without requiring a server restart.

### What Gets Reloaded

- Swagger specification mappings
- Investigation team email addresses
- Environment monitoring endpoints

### What Requires Restart

- Environment variables (.env)
- Server port
- SMTP credentials

### How It Works

1. File watcher detects changes to `config.json`
2. Configuration is validated
3. If valid, new configuration is applied
4. Swagger specification cache is cleared
5. Environment monitoring is restarted with new endpoints
6. Event is logged

### Validation

Configuration changes are validated before being applied:
- JSON syntax must be valid
- Required fields must be present
- URLs must be properly formatted
- Email addresses must be valid

If validation fails, the old configuration remains active and an error is logged.

## Validation

### Configuration Validation on Startup

The application validates configuration on startup and fails fast if invalid:

1. **config.json validation:**
   - File must exist
   - Must be valid JSON
   - Required sections must be present
   - URLs must be properly formatted

2. **Environment variable validation:**
   - Required variables must be set
   - Email addresses must be valid
   - Port must be a valid number

3. **SMTP validation:**
   - Attempts to connect to SMTP server
   - Logs warning if connection fails (doesn't prevent startup)

### Runtime Validation

- Error report submissions are validated for required fields
- Swagger specifications are validated when loaded
- Health check URLs are validated before monitoring starts

## Troubleshooting Configuration

### Configuration File Not Found

**Error:** `Configuration file not found: config.json`

**Solution:**
- Ensure `config.json` exists in the `backend` directory
- Check file permissions (must be readable)
- Verify working directory is correct

### Invalid JSON Syntax

**Error:** `Invalid JSON in configuration file`

**Solution:**
- Validate JSON syntax using a JSON validator
- Check for missing commas, brackets, or quotes
- Ensure no trailing commas (not allowed in JSON)

### Missing Required Fields

**Error:** `Missing required configuration: swaggerSpecs`

**Solution:**
- Ensure all required sections are present
- Check field names match exactly (case-sensitive)
- Refer to example configuration above

### SMTP Connection Failed

**Error:** `Failed to connect to SMTP server`

**Solution:**
- Verify SMTP credentials are correct
- Check SMTP_HOST and SMTP_PORT are correct
- Ensure firewall allows outbound SMTP connections
- Test credentials with email client
- For Gmail, generate an App Password

### Swagger Specification Not Loading

**Error:** `Failed to load Swagger specification`

**Solution:**
- Verify specUrl is accessible (test in browser)
- Check URL returns valid JSON or YAML
- Ensure specification follows OpenAPI/Swagger format
- Check for CORS issues if specification is on different domain

### Environment Health Check Failing

**Issue:** All environments show as "inactive"

**Solution:**
- Verify healthCheckUrl is accessible
- Check health check endpoint returns 2xx status
- Ensure timeout (5 seconds) is sufficient
- Test URL with curl: `curl -i https://api.example.com/health`

## Security Best Practices

1. **Never commit .env to version control**
   - Add `.env` to `.gitignore`
   - Use `.env.example` as a template

2. **Restrict file permissions**
   ```bash
   chmod 600 .env
   chmod 644 config.json
   ```

3. **Use environment-specific configurations**
   - Separate config files for dev/staging/prod
   - Different SMTP credentials per environment

4. **Rotate credentials regularly**
   - Change SMTP passwords periodically
   - Update API keys and tokens

5. **Use secret management services**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault

6. **Validate all configuration**
   - Don't trust user-provided configuration
   - Sanitize URLs and email addresses
   - Validate against schema

## Configuration Schema

For reference, here's a JSON schema for `config.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["swaggerSpecs", "email", "environments"],
  "properties": {
    "swaggerSpecs": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["pattern", "specUrl"],
        "properties": {
          "pattern": {
            "type": "string",
            "pattern": "^/"
          },
          "specUrl": {
            "type": "string",
            "format": "uri"
          }
        }
      }
    },
    "email": {
      "type": "object",
      "required": ["teamEmails"],
      "properties": {
        "teamEmails": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "string",
            "format": "email"
          }
        }
      }
    },
    "environments": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["name", "healthCheckUrl"],
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1
          },
          "healthCheckUrl": {
            "type": "string",
            "format": "uri"
          }
        }
      }
    }
  }
}
```
