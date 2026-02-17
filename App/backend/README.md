# API Error Logger - Backend

Express.js backend server for the API Error Logger application.

## Features

- Express server with CORS and JSON parsing middleware
- Configuration loading from config.json and environment variables
- Health check endpoint
- Global error handling middleware
- Structured JSON logging with request tracing
- Error report submission and validation
- Email notifications with retry logic
- Environment health monitoring
- Configuration hot-reload

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=3000
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
EMAIL_FROM=api-errors@example.com
```

4. Edit `config.json` with your settings:
- Swagger specification URLs
- Team email addresses
- Environment health check URLs

## Running

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Testing

Run all tests:
```bash
npm test
```

## API Endpoints

### Health Check
```
GET /api/health
```

Returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Submit Error Report
```
POST /api/error-reports
```

Request body:
```json
{
  "endpoint": "/api/users",
  "method": "POST",
  "payload": { "name": "John" },
  "errorDescription": "User creation failed",
  "userContact": "user@example.com"
}
```

### Get Environment Status
```
GET /api/environments/status
```

Returns:
```json
{
  "environments": [
    {
      "name": "Production",
      "status": "active",
      "lastChecked": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Structured Logging

The application uses structured JSON logging for all events. Each log entry includes:

- Timestamp
- Log level (info, warn, error, debug)
- Message
- Event type
- Request ID (for tracing)
- Additional metadata

See [STRUCTURED_LOGGING.md](./docs/STRUCTURED_LOGGING.md) for detailed documentation on:
- Log structure and format
- Event types
- Request tracing
- Log analysis examples
- Integration with log management systems

## Configuration

### Environment Variables

- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3000)
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP server port
- `SMTP_SECURE`: Use TLS (true/false)
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `EMAIL_FROM`: From email address

### config.json

```json
{
  "swaggerSpecs": [
    {
      "pattern": "/api/users/*",
      "specUrl": "https://api.example.com/swagger/users.json"
    }
  ],
  "email": {
    "teamEmails": ["team@example.com"]
  },
  "environments": [
    {
      "name": "Production",
      "healthCheckUrl": "https://api.prod.example.com/health"
    }
  ]
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration loading
│   ├── middleware/      # Express middleware (error handling, request ID)
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions (logger)
│   ├── validators/      # Validation logic
│   └── server.js        # Main entry point
├── tests/               # Test files
├── docs/                # Documentation
│   ├── STRUCTURED_LOGGING.md  # Logging documentation
│   └── CONFIG_HOT_RELOAD.md   # Configuration hot-reload guide
├── config.json          # Application configuration
├── .env                 # Environment variables (not in git)
└── package.json         # Dependencies
```
