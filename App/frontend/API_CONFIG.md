# Frontend API Configuration

## Overview

The frontend communicates with the backend API using axios. All API requests are proxied through Vite's dev server in development mode.

## Configuration Files

### `.env` (Frontend)

```env
VITE_API_BASE_URL=http://localhost:3000
```

This variable is used by Vite's proxy configuration to forward API requests to the backend.

### `vite.config.js`

```javascript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:3000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true
        }
      }
    }
  };
});
```

## API Service (`src/services/api.js`)

The base axios instance is configured with:

- **Base URL:** `/api` (proxied to backend in development)
- **Timeout:** 10 seconds
- **Headers:** `Content-Type: application/json`

### Request Interceptor

Logs requests and can be extended to add authentication tokens.

### Response Interceptor

Handles network errors and provides user-friendly error messages.

## Service Modules

### Error Report Service (`src/services/errorReportService.js`)

```javascript
import { submitErrorReport } from './services/errorReportService';

const result = await submitErrorReport({
  endpoint: '/api/users',
  method: 'POST',
  payload: { name: 'John' },
  errorDescription: 'Error description',
  userContact: 'user@example.com' // optional
});
```

**Endpoint:** `POST /api/error-reports`

**Response:**
```javascript
{
  success: boolean,
  message: string,
  validationErrors?: string[] // only if validation failed
}
```

### Environment Status Service (`src/services/environmentService.js`)

```javascript
import { fetchEnvironmentStatus } from './services/environmentService';

const result = await fetchEnvironmentStatus();
```

**Endpoint:** `GET /api/environments/status`

**Response:**
```javascript
{
  environments: [
    {
      name: string,
      status: "active" | "inactive",
      lastChecked: string // ISO 8601 timestamp
    }
  ]
}
```

## Error Handling

All services include comprehensive error handling:

### Network Errors (No Response)

When the backend is unreachable:

```javascript
if (!error.response) {
  // Network error
  message = "Unable to connect to server. Please check your connection and ensure the backend is running.";
}
```

### Server Errors (5xx)

When the backend returns a server error:

```javascript
if (error.response.status >= 500) {
  message = "Server error occurred. Please try again later.";
}
```

### Client Errors (4xx)

When the request is invalid:

```javascript
message = error.response.data.message || "Request failed";
validationErrors = error.response.data.validationErrors || [];
```

## Development vs Production

### Development Mode

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Proxy: Vite proxies `/api/*` to backend

**How it works:**
1. Frontend makes request to `/api/error-reports`
2. Vite intercepts and forwards to `http://localhost:3000/api/error-reports`
3. Backend processes and responds
4. Response is returned to frontend

### Production Mode

In production, you have two options:

**Option 1: Same Origin (Recommended)**
- Serve frontend and backend from the same domain
- Configure your web server (nginx, Apache) to proxy `/api/*` to backend

**Option 2: Different Origin**
- Update `src/services/api.js` to use full backend URL
- Ensure backend CORS is configured to allow frontend origin

## Changing the Backend URL

### Development

Update `frontend/.env`:
```env
VITE_API_BASE_URL=http://different-host:3000
```

Restart the Vite dev server.

### Production

**Option 1:** Environment variable at build time
```bash
VITE_API_BASE_URL=https://api.production.com npm run build
```

**Option 2:** Update `src/services/api.js`
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  // ...
});
```

## Testing API Configuration

### Check Backend Health

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}
```

### Check Frontend Proxy

1. Start both servers
2. Open browser DevTools (F12)
3. Go to Network tab
4. Submit an error report
5. Check the request URL - should be `/api/error-reports` (not full URL)
6. Check the response - should come from backend

### Test Error Handling

1. Stop the backend server
2. Try submitting an error report
3. Should see: "Unable to connect to server..."

## Common Issues

### Issue: "Unable to connect to server"

**Cause:** Backend is not running or wrong port

**Solution:**
1. Start backend: `cd backend && npm start`
2. Check port in `backend/.env`
3. Check proxy in `frontend/vite.config.js`

### Issue: CORS errors

**Cause:** Backend CORS not configured or wrong origin

**Solution:**
1. Verify backend has `app.use(cors())` in `server.js`
2. Check backend console for CORS errors
3. Restart both servers

### Issue: 404 Not Found

**Cause:** Wrong API endpoint or proxy not working

**Solution:**
1. Check endpoint path in service files
2. Verify Vite proxy configuration
3. Check backend routes are registered

### Issue: Timeout errors

**Cause:** Backend is slow or not responding

**Solution:**
1. Check backend logs for errors
2. Increase timeout in `src/services/api.js`
3. Check backend health: `curl http://localhost:3000/api/health`

## Requirements Satisfied

This configuration satisfies:

- **Requirement 1.2:** Error request data capture and submission
- **Requirement 1.3:** Immediate feedback on submission
- **Requirement 4.1:** Success message display
- **Requirement 4.2:** Validation error display
- **Requirement 5.2:** Environment status display with real data

## Related Documentation

- [INTEGRATION.md](./INTEGRATION.md) - Detailed integration guide
- [MANUAL_TEST_GUIDE.md](../MANUAL_TEST_GUIDE.md) - Manual testing instructions
- [Backend API Documentation](../backend/README.md) - Backend API details
