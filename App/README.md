# API Error Logger

A web application that enables users to report errors encountered when consuming APIs. The system validates submitted error requests against Swagger/OpenAPI specifications and notifies the investigation team when valid errors are reported.

## Project Structure

```
api-error-logger/
├── backend/                 # Backend API server (Node.js + Express)
│   ├── src/
│   │   ├── config/         # Configuration loader
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   ├── validators/     # Swagger validation
│   │   └── server.js       # Main server entry point
│   ├── tests/              # Backend tests
│   ├── config.json         # Application configuration
│   ├── .env.example        # Environment variables template
│   └── package.json        # Backend dependencies
│
└── frontend/               # Frontend web interface (React + Vite)
    ├── src/
    │   ├── components/     # React components
    │   ├── services/       # API client services
    │   ├── App.jsx         # Main App component
    │   ├── App.css         # App styles
    │   ├── main.jsx        # React entry point
    │   └── index.css       # Global styles
    ├── index.html          # HTML template
    ├── vite.config.js      # Vite configuration
    └── package.json        # Frontend dependencies
```

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   - SMTP credentials for email notifications
   - Server port (default: 3000)

5. Update `config.json` with your:
   - Swagger specification URLs
   - Investigation team email addresses
   - Environment health check endpoints
   
   **Tip:** See `config.sample.json` for a fully documented example configuration.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on http://localhost:3000

2. In a separate terminal, start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on http://localhost:5173

3. Open your browser and navigate to http://localhost:5173

**Note:** The frontend uses Vite's proxy to forward API requests to the backend. Ensure both servers are running for full functionality.

### Production Mode

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Start the backend:
   ```bash
   cd backend
   npm start
   ```

## Testing the Integration

### Quick Test

1. Ensure both backend and frontend are running
2. Navigate to http://localhost:5173
3. Try submitting an error report
4. Check the Environment Status section

For detailed testing instructions, see [MANUAL_TEST_GUIDE.md](./MANUAL_TEST_GUIDE.md)

For integration documentation, see [frontend/INTEGRATION.md](./frontend/INTEGRATION.md)

## Configuration

The application uses two configuration sources:
1. **config.json** - Application settings (Swagger specs, email recipients, environments)
2. **Environment variables (.env)** - Sensitive credentials and runtime settings

### Configuration File Format (`backend/config.json`)

The `config.json` file contains all non-sensitive application configuration. The system supports hot-reloading, so changes to this file are applied automatically without restarting the server.

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
    }
  ],
  "email": {
    "teamEmails": [
      "team@example.com",
      "investigation@example.com"
    ]
  },
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

#### Configuration Fields

**swaggerSpecs** (array, required)
- Array of Swagger/OpenAPI specification mappings
- Each entry contains:
  - `pattern` (string): URL pattern to match (supports wildcards with `*`)
  - `specUrl` (string): URL to the OpenAPI/Swagger specification file
- Used to validate error reports against the correct API specification
- Specifications are cached after first load for performance

**email** (object, required)
- Email notification configuration
- Fields:
  - `teamEmails` (array of strings): Email addresses of investigation team members
  - All addresses will receive notifications for validated error reports

**environments** (array, required)
- List of API environments to monitor
- Each entry contains:
  - `name` (string): Display name for the environment
  - `healthCheckUrl` (string): URL to check environment availability
- Status is checked every 60 seconds
- Timeout is set to 5 seconds per health check

### Environment Variables (`backend/.env`)

Environment variables store sensitive credentials and runtime configuration. Create a `.env` file in the `backend` directory based on `.env.example`.

```bash
# Server Configuration
NODE_ENV=development          # Environment: development, production
PORT=3000                     # Server port (default: 3000)

# SMTP Email Configuration
SMTP_HOST=smtp.example.com    # SMTP server hostname
SMTP_PORT=587                 # SMTP server port (587 for TLS, 465 for SSL)
SMTP_SECURE=false             # Use SSL/TLS (true for port 465, false for 587)
SMTP_USER=your-email@example.com    # SMTP authentication username
SMTP_PASS=your-password       # SMTP authentication password

# Email Settings
EMAIL_FROM=api-errors@example.com   # Sender email address
```

#### Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Application environment (development/production) |
| `PORT` | No | `3000` | Port number for the backend server |
| `SMTP_HOST` | Yes | - | SMTP server hostname for sending emails |
| `SMTP_PORT` | Yes | - | SMTP server port (587 for TLS, 465 for SSL) |
| `SMTP_SECURE` | No | `false` | Use SSL/TLS connection (true/false) |
| `SMTP_USER` | Yes | - | SMTP authentication username |
| `SMTP_PASS` | Yes | - | SMTP authentication password |
| `EMAIL_FROM` | Yes | - | Sender email address for notifications |

**Note:** The application will fail to start if required environment variables are missing.

### Configuration Hot-Reload

The system monitors `config.json` for changes and automatically reloads configuration without requiring a server restart. This includes:
- Swagger specification mappings
- Investigation team email addresses
- Environment monitoring endpoints

Changes to environment variables (`.env`) require a server restart.

## API Endpoints

### POST /api/error-reports

Submit an error report for validation and notification.

**Request Body:**
```json
{
  "endpoint": "/api/users/123",
  "method": "POST",
  "payload": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "errorDescription": "Received 500 Internal Server Error when creating user",
  "userContact": "reporter@example.com"
}
```

**Request Fields:**
- `endpoint` (string, required): API endpoint path that caused the error
- `method` (string, required): HTTP method (GET, POST, PUT, DELETE, etc.)
- `payload` (object, required): Request body or parameters sent to the API
- `errorDescription` (string, required): Description of the error encountered
- `userContact` (string, optional): Contact information for follow-up

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Error report validated and email sent to investigation team"
}
```

**Validation Failure Response (200 OK):**
```json
{
  "success": false,
  "message": "Validation failed",
  "validationErrors": [
    "Field 'email' is required but was not provided",
    "Field 'name' must be a string"
  ]
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Missing required fields: endpoint, method, payload, errorDescription"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "An unexpected error occurred. Please try again."
}
```

### GET /api/environments/status

Get the current operational status of all configured API environments.

**Response (200 OK):**
```json
{
  "environments": [
    {
      "name": "Production",
      "status": "active",
      "lastChecked": "2024-01-15T10:30:45.123Z"
    },
    {
      "name": "Staging",
      "status": "inactive",
      "lastChecked": "2024-01-15T10:30:45.456Z"
    },
    {
      "name": "Development",
      "status": "active",
      "lastChecked": "2024-01-15T10:30:45.789Z"
    }
  ]
}
```

**Response Fields:**
- `environments` (array): List of environment status objects
  - `name` (string): Environment name from configuration
  - `status` (string): Either "active" or "inactive"
  - `lastChecked` (string): ISO 8601 timestamp of last health check

**Notes:**
- Status is cached and updated every 60 seconds
- An environment is "active" if its health check endpoint responds with 2xx status within 5 seconds
- An environment is "inactive" if the health check times out or returns an error

### GET /api/health

Health check endpoint for monitoring the backend server.

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

**Usage:**
- Use this endpoint to verify the backend server is running
- Useful for load balancers, monitoring tools, and troubleshooting

## Features

- **Error Report Submission**: Submit error reports through an intuitive web interface
- **Swagger Validation**: Automatically validate requests against OpenAPI/Swagger specifications
- **Email Notifications**: Investigation team receives email alerts for validated errors
- **Real-time Monitoring**: Live environment status dashboard with auto-refresh
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Configuration Hot-Reload**: Update settings without restarting the server

## How It Works

### Error Report Workflow

1. **User Submission**: User fills out the error report form with:
   - API endpoint that caused the error
   - HTTP method used
   - Request payload sent
   - Description of the error
   - Optional contact information

2. **Validation**: The system validates the request against the corresponding Swagger/OpenAPI specification:
   - Checks if the endpoint exists in the specification
   - Validates the HTTP method is allowed for that endpoint
   - Validates the request payload against the schema
   - Checks required fields and data types

3. **Notification**: If validation passes:
   - An email is sent to all configured investigation team members
   - Email includes all error details and user contact information
   - System retries up to 3 times if email delivery fails

4. **User Feedback**: The user receives immediate feedback:
   - Success message if validation passed and email was sent
   - Detailed validation errors if the request doesn't match the specification
   - Clear error messages if required fields are missing

### Environment Monitoring

- The system continuously monitors configured API environments
- Health checks run every 60 seconds
- Each environment is marked as "active" or "inactive"
- Status updates appear in real-time on the dashboard
- Helps users determine if errors might be due to environment outages

### Email Notification Format

When a valid error report is submitted, the investigation team receives an email with:

**Subject:** API Error Report: [endpoint]

**Body:**
- API Endpoint
- HTTP Method
- Request Payload (formatted JSON)
- Error Description
- User Contact (if provided)
- Timestamp
- Validation Status

The email uses HTML formatting for easy readability.

## Testing

Run tests for backend:
```bash
cd backend
npm test
```

Run tests for frontend:
```bash
cd frontend
npm test
```

### Integration Tests

The frontend includes integration tests that verify the connection to the backend. These tests require the backend server to be running:

```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Run frontend tests
cd frontend
npm test
```

## Troubleshooting

### "Unable to connect to server"

If you see this error in the frontend:

1. **Check if backend is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Check backend port:** Verify `backend/.env` has `PORT=3000`

3. **Check Vite proxy:** Verify `frontend/vite.config.js` proxy configuration

### CORS Errors

If you see CORS errors in the browser console:
- Ensure the backend has CORS middleware enabled (it should be by default)
- Restart both servers

### Environment Status Not Loading

- Verify backend is running
- Check `backend/config.json` has environments configured
- Note: Example health check URLs will show as "inactive" (this is expected)

### Email Notifications Not Sending

1. **Verify SMTP configuration:**
   - Check `backend/.env` has correct SMTP credentials
   - Test SMTP connection with your email provider

2. **Check email logs:**
   - Backend logs show email delivery attempts
   - Look for error messages in the console

3. **Common SMTP issues:**
   - Gmail requires "App Passwords" if 2FA is enabled
   - Some providers block port 587, try port 465 with `SMTP_SECURE=true`
   - Verify firewall allows outbound SMTP connections

### Validation Always Failing

1. **Check Swagger specification URL:**
   - Verify `specUrl` in `config.json` is accessible
   - Test URL in browser: should return valid JSON/YAML

2. **Check endpoint pattern matching:**
   - Pattern `/api/users/*` matches `/api/users/123` but not `/api/products/456`
   - Use multiple patterns for different API sections

3. **Review validation errors:**
   - Error messages indicate which fields failed validation
   - Compare request payload with Swagger schema

For more troubleshooting help, see [MANUAL_TEST_GUIDE.md](./MANUAL_TEST_GUIDE.md)

## Deployment

### Production Deployment

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```
   This creates optimized static files in `frontend/dist/`

2. **Serve frontend with backend:**
   Configure your backend to serve the static files, or use a reverse proxy (nginx, Apache)

3. **Set production environment variables:**
   ```bash
   NODE_ENV=production
   PORT=3000
   # ... other variables
   ```

4. **Start the backend:**
   ```bash
   cd backend
   npm start
   ```

### Using a Process Manager

For production, use a process manager like PM2:

```bash
npm install -g pm2

# Start the backend
cd backend
pm2 start src/server.js --name api-error-logger

# Monitor
pm2 status
pm2 logs api-error-logger

# Restart on changes
pm2 restart api-error-logger
```

### Reverse Proxy Configuration (nginx)

Example nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Environment-Specific Configuration

Create different config files for each environment:

```bash
backend/
├── config.json              # Default configuration
├── config.development.json  # Development overrides
├── config.production.json   # Production overrides
└── config.staging.json      # Staging overrides
```

Load based on `NODE_ENV`:
```javascript
const env = process.env.NODE_ENV || 'development';
const config = require(`./config.${env}.json`);
```

### Security Considerations

1. **Use HTTPS in production:**
   - Configure SSL/TLS certificates
   - Redirect HTTP to HTTPS

2. **Secure environment variables:**
   - Never commit `.env` to version control
   - Use secret management services (AWS Secrets Manager, HashiCorp Vault)

3. **Rate limiting:**
   - Implement rate limiting on API endpoints
   - Prevent abuse of error submission endpoint

4. **Input validation:**
   - All user inputs are validated server-side
   - Sanitize error descriptions to prevent XSS

5. **CORS configuration:**
   - Configure CORS to allow only trusted origins in production
   - Update `backend/src/server.js` CORS settings

### Monitoring and Logging

The application logs important events:
- Error report submissions
- Validation results (pass/fail)
- Email delivery attempts and results
- Environment status changes
- Configuration reload events

Logs are written to stdout in JSON format for easy parsing by log aggregation tools (ELK, Splunk, CloudWatch).

### Performance Optimization

1. **Swagger specification caching:**
   - Specifications are cached after first load
   - Reduces latency for validation

2. **Environment status caching:**
   - Status is cached and updated every 60 seconds
   - Prevents excessive health check requests

3. **Connection pooling:**
   - SMTP connections are reused when possible
   - Reduces email delivery latency

### Backup and Recovery

1. **Configuration backup:**
   - Regularly backup `config.json`
   - Version control recommended

2. **Log retention:**
   - Configure log rotation
   - Archive logs for audit purposes

3. **Email delivery failures:**
   - Failed emails are logged with full details
   - Manual retry possible using logged information

## Documentation

- **[README.md](./README.md)** - This file, overview and quick start guide
- **[backend/API.md](./backend/API.md)** - Complete API endpoint documentation
- **[backend/CONFIGURATION.md](./backend/CONFIGURATION.md)** - Detailed configuration guide
- **[MANUAL_TEST_GUIDE.md](./MANUAL_TEST_GUIDE.md)** - Manual testing instructions
- **[frontend/INTEGRATION.md](./frontend/INTEGRATION.md)** - Frontend integration guide
- **[backend/docs/STRUCTURED_LOGGING.md](./backend/docs/STRUCTURED_LOGGING.md)** - Logging documentation
- **[backend/docs/CONFIG_HOT_RELOAD.md](./backend/docs/CONFIG_HOT_RELOAD.md)** - Configuration hot-reload details

## Quick Links

- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)

## License

ISC
