# Project Structure

## Root Organization

```
App/
├── backend/          # Express.js API server
├── frontend/         # React web application
├── README.md         # Main project documentation
└── *.md             # Additional documentation files
```

## Backend Structure

```
backend/
├── src/
│   ├── config/           # Configuration loading and hot-reload
│   ├── middleware/       # Express middleware (error handling, request ID)
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic (email, environment monitoring)
│   ├── utils/            # Utilities (structured logger)
│   ├── validators/       # Swagger/OpenAPI validation
│   └── server.js         # Main entry point
├── tests/                # Test files (mirrors src structure)
├── docs/                 # Additional documentation
├── config.json           # Application configuration (hot-reloadable)
├── config.sample.json    # Documented config example
├── .env                  # Environment variables (not in git)
└── package.json          # Dependencies and scripts
```

## Frontend Structure

```
frontend/
├── src/
│   ├── components/       # React components
│   │   ├── *.jsx        # Component files
│   │   └── components.css  # Shared component styles
│   ├── services/         # API client layer
│   │   ├── api.js       # Axios instance configuration
│   │   ├── *Service.js  # Service modules per domain
│   │   └── __tests__/   # Service integration tests
│   ├── App.jsx           # Main application component
│   ├── App.css           # Application styles
│   ├── main.jsx          # React entry point
│   └── index.css         # Global styles
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
└── package.json          # Dependencies and scripts
```

## Key Conventions

### File Naming
- Backend: camelCase for JS files (`errorHandler.js`, `emailService.js`)
- Frontend: PascalCase for components (`ErrorSubmissionForm.jsx`)
- Frontend: camelCase for services (`errorReportService.js`)
- Tests: `*.test.js` suffix, located in `tests/` or `__tests__/` directories

### Module Organization
- Backend routes use Express Router pattern
- Frontend services provide abstraction over API calls
- Middleware applied globally in `server.js`
- Configuration accessed via `app.locals.config` in routes

### Testing
- Backend: Node.js test runner with `describe`/`it` structure
- Frontend: Vitest with similar structure
- Integration tests require backend server running
- Property-based tests use fast-check library

### Configuration
- Sensitive data (credentials) in `.env` files
- Application settings in `config.json`
- Config hot-reload supported for `config.json` only
- Sample/example configs provided for reference

### Logging
- Structured JSON logging via `utils/logger.js`
- Request IDs for tracing across operations
- Event-based log entries with metadata
- Separate log functions per event type
