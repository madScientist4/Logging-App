# Frontend-Backend Integration Guide

This document explains how the frontend connects to the backend API and how to test the integration.

## Configuration

### API Base URL

The frontend is configured to communicate with the backend API through Vite's proxy configuration. The API base URL can be configured using environment variables.

**Environment Variables:**

Create a `.env` file in the `frontend` directory (see `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:3000
```

**Default Configuration:**
- Backend API: `http://localhost:3000`
- Frontend Dev Server: `http://localhost:5173`
- API Proxy: `/api` → `http://localhost:3000/api`

### How It Works

1. **Development Mode**: Vite's dev server proxies all `/api/*` requests to the backend server
2. **Production Mode**: The frontend should be configured to point to the production backend URL

## API Services

### Error Report Service

Located in `src/services/errorReportService.js`

**Function:** `submitErrorReport(errorData)`

Submits an error report to the backend for validation.

```javascript
const result = await submitErrorReport({
  endpoint: '/api/users',
  method: 'POST',
  payload: { name: 'John' },
  errorDescription: 'Error description',
  userContact: 'user@example.com' // optional
});
```

**Response:**
```javascript
{
  success: true,
  message: "Email sent to investigation team"
}
// OR
{
  success: false,
  message: "Validation failed",
  validationErrors: ["Error 1", "Error 2"]
}
```

### Environment Status Service

Located in `src/services/environmentService.js`

**Function:** `fetchEnvironmentStatus()`

Fetches the current status of all monitored environments.

```javascript
const result = await fetchEnvironmentStatus();
```

**Response:**
```javascript
{
  environments: [
    {
      name: "Production",
      status: "active",
      lastChecked: "2024-01-15T10:30:00Z"
    },
    {
      name: "Staging",
      status: "inactive",
      lastChecked: "2024-01-15T10:30:00Z"
    }
  ]
}
```

## Error Handling

Both services include comprehensive error handling for network failures:

### Network Errors

When the backend is unreachable:
```
"Unable to connect to server. Please check your connection and ensure the backend is running."
```

### Server Errors (5xx)

When the backend returns a server error:
```
"Server error occurred. Please try again later."
```

### Validation Errors (4xx)

When the request fails validation:
```
{
  success: false,
  message: "Validation failed",
  validationErrors: ["Specific error messages"]
}
```

## Testing the Connection

### Prerequisites

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```
   The backend should be running on `http://localhost:3000`

2. Start the frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend should be running on `http://localhost:5173`

### Manual Testing

1. **Test Error Submission:**
   - Navigate to `http://localhost:5173`
   - Fill out the error submission form
   - Click "Submit Error Report"
   - Verify you receive feedback (success or validation errors)

2. **Test Environment Status:**
   - Scroll to the "Environment Status" section
   - Verify environments are displayed with status indicators
   - Wait 60 seconds and verify the status refreshes automatically

3. **Test Network Error Handling:**
   - Stop the backend server
   - Try submitting an error report
   - Verify you see: "Unable to connect to server..."
   - Refresh the page and check environment status
   - Verify you see an appropriate error message

### Automated Testing

Run the integration tests:

```bash
cd frontend
npm test
```

**Note:** Integration tests require the backend to be running. If the backend is not available, tests will be skipped with a warning.

## Troubleshooting

### "Unable to connect to server"

**Possible causes:**
1. Backend server is not running
2. Backend is running on a different port
3. Network/firewall issues

**Solutions:**
1. Start the backend: `cd backend && npm start`
2. Check backend port in `backend/.env` (should be 3000)
3. Verify Vite proxy configuration in `frontend/vite.config.js`

### CORS Errors

If you see CORS errors in the browser console:

1. Verify the backend has CORS enabled (it should be by default)
2. Check that the backend's CORS configuration allows requests from `http://localhost:5173`

### Proxy Not Working

If API requests are not being proxied:

1. Restart the Vite dev server
2. Verify the proxy configuration in `vite.config.js`
3. Check that requests are being made to `/api/*` (not the full URL)

## Production Deployment

For production deployment:

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Configure production API URL:**
   - Update the `.env` file or set environment variables during build
   - Or configure your web server to proxy `/api` requests to the backend

3. **Serve the built files:**
   - The `dist` folder contains the production build
   - Serve these files with any static file server
   - Ensure `/api` requests are proxied to your backend server

## API Endpoints Used

The frontend communicates with these backend endpoints:

- `POST /api/error-reports` - Submit error report
- `GET /api/environments/status` - Get environment status
- `GET /api/health` - Health check (used for testing)

## Requirements Validated

This integration satisfies the following requirements:

- **1.2**: Error request data capture and submission
- **1.3**: Immediate feedback on submission
- **4.1**: Success message display
- **4.2**: Validation error display
- **5.2**: Environment status display with real data

## Next Steps

After verifying the integration works:

1. Test with real Swagger specifications
2. Configure real environment health check URLs
3. Set up email notifications (SMTP configuration)
4. Deploy to production environment
