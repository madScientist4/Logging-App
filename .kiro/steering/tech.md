# Technology Stack

## Backend

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 4.x
- **Key Libraries**:
  - `cors` - CORS middleware
  - `dotenv` - Environment variable management
  - `nodemailer` - Email delivery with retry logic
  - `swagger-parser` - OpenAPI/Swagger spec parsing
  - `openapi-request-validator` - Request validation against specs
  - `node-cron` - Scheduled tasks (environment monitoring)
- **Testing**: Node.js built-in test runner (`node:test`)
- **Property-Based Testing**: fast-check

## Frontend

- **Framework**: React 18
- **Build Tool**: Vite 5.x
- **HTTP Client**: Axios
- **Testing**: Vitest
- **Property-Based Testing**: fast-check

## Common Commands

### Backend

```bash
cd App/backend

# Development (with auto-reload)
npm run dev

# Production
npm start

# Run tests
npm test
```

### Frontend

```bash
cd App/frontend

# Development server (http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm preview

# Run tests
npm test
```

## Development Setup

1. Backend runs on port 3000 (configurable via PORT env var)
2. Frontend runs on port 5173 (Vite default)
3. Vite proxy forwards `/api/*` requests to backend
4. Both servers must run simultaneously for full functionality

## Configuration

- **Backend**: `config.json` (hot-reloadable) + `.env` (requires restart)
- **Frontend**: `vite.config.js` for build and proxy settings
- Environment variables loaded via `dotenv` package
