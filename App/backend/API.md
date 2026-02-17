# API Documentation

This document provides detailed information about the API Error Logger backend API endpoints.

## Base URL

**Development:** `http://localhost:3000`  
**Production:** Configure based on your deployment

## Authentication

Currently, the API does not require authentication. Consider adding authentication for production deployments to prevent abuse.

## Endpoints

### POST /api/error-reports

Submit an error report for validation and notification to the investigation team.

#### Request

**Method:** POST  
**Content-Type:** application/json

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

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `endpoint` | string | Yes | API endpoint path that caused the error (e.g., `/api/users/123`) |
| `method` | string | Yes | HTTP method used (GET, POST, PUT, DELETE, PATCH, etc.) |
| `payload` | object | Yes | Request body or parameters sent to the API |
| `errorDescription` | string | Yes | Detailed description of the error encountered |
| `userContact` | string | No | Contact information (email) for follow-up |

**Validation Rules:**

- All required fields must be present
- `endpoint` must start with `/`
- `method` must be a valid HTTP method
- `payload` must be a valid JSON object
- `errorDescription` must be non-empty

#### Response

**Success (Validation Passed) - 200 OK:**

```json
{
  "success": true,
  "message": "Error report validated and email sent to investigation team"
}
```

**Validation Failed - 200 OK:**

```json
{
  "success": false,
  "message": "Validation failed",
  "validationErrors": [
    "Field 'email' is required but was not provided",
    "Field 'name' must be a string",
    "Field 'age' must be a number"
  ]
}
```

**Bad Request - 400:**

```json
{
  "error": "Missing required fields: endpoint, method, payload, errorDescription"
}
```

**Server Error - 500:**

```json
{
  "error": "An unexpected error occurred. Please try again."
}
```

#### Workflow

1. Request is received and validated for required fields
2. Swagger specification is loaded based on endpoint pattern
3. Request payload is validated against the Swagger schema
4. If validation passes:
   - Email notification is sent to investigation team
   - Success response is returned
5. If validation fails:
   - Validation errors are returned to user
   - No email is sent

#### Examples

**Example 1: Valid Request**

```bash
curl -X POST http://localhost:3000/api/error-reports \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/api/users/123",
    "method": "GET",
    "payload": {},
    "errorDescription": "User not found error",
    "userContact": "developer@example.com"
  }'
```

**Example 2: Missing Required Field**

```bash
curl -X POST http://localhost:3000/api/error-reports \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/api/users/123",
    "method": "POST",
    "errorDescription": "Error occurred"
  }'
```

Response:
```json
{
  "error": "Missing required fields: payload"
}
```

**Example 3: Validation Failure**

```bash
curl -X POST http://localhost:3000/api/error-reports \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/api/users",
    "method": "POST",
    "payload": {
      "name": 123,
      "email": "invalid-email"
    },
    "errorDescription": "Validation error"
  }'
```

Response:
```json
{
  "success": false,
  "message": "Validation failed",
  "validationErrors": [
    "Field 'name' must be a string",
    "Field 'email' must be a valid email address"
  ]
}
```

---

### GET /api/environments/status

Get the current operational status of all configured API environments.

#### Request

**Method:** GET  
**Parameters:** None

#### Response

**Success - 200 OK:**

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

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `environments` | array | List of environment status objects |
| `environments[].name` | string | Environment name from configuration |
| `environments[].status` | string | Either "active" or "inactive" |
| `environments[].lastChecked` | string | ISO 8601 timestamp of last health check |

**Status Values:**

- `active`: Health check endpoint responded with 2xx status within 5 seconds
- `inactive`: Health check timed out, returned error, or non-2xx status

#### Behavior

- Status is cached and updated every 60 seconds
- Returns cached status immediately (no delay)
- If no environments are configured, returns empty array
- Health checks run in background and don't block requests

#### Examples

**Example 1: Get Environment Status**

```bash
curl http://localhost:3000/api/environments/status
```

Response:
```json
{
  "environments": [
    {
      "name": "Production",
      "status": "active",
      "lastChecked": "2024-01-15T10:30:45.123Z"
    }
  ]
}
```

**Example 2: No Environments Configured**

```bash
curl http://localhost:3000/api/environments/status
```

Response:
```json
{
  "environments": []
}
```

---

### GET /api/health

Health check endpoint for monitoring the backend server.

#### Request

**Method:** GET  
**Parameters:** None

#### Response

**Success - 200 OK:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always "ok" if server is running |
| `timestamp` | string | ISO 8601 timestamp of the response |

#### Usage

- Use this endpoint to verify the backend server is running
- Useful for load balancers and monitoring tools
- Does not check database or external service connectivity
- Always returns 200 OK if server is responsive

#### Examples

**Example 1: Health Check**

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

**Example 2: Using with Monitoring Tools**

```bash
# Check if server is healthy (exit code 0 if healthy)
curl -f http://localhost:3000/api/health > /dev/null 2>&1 && echo "Healthy" || echo "Unhealthy"
```

---

## Error Handling

### Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Status Code | Meaning | When Used |
|-------------|---------|-----------|
| 200 | OK | Request succeeded (including validation failures) |
| 400 | Bad Request | Missing required fields or invalid request format |
| 404 | Not Found | Endpoint does not exist |
| 500 | Internal Server Error | Unexpected server error |

**Note:** Validation failures return 200 OK with `success: false` in the response body, not 400 Bad Request.

### Common Errors

**Missing Required Fields:**
```json
{
  "error": "Missing required fields: endpoint, method"
}
```

**Invalid JSON:**
```json
{
  "error": "Invalid JSON in request body"
}
```

**Swagger Specification Not Found:**
```json
{
  "success": false,
  "message": "Validation failed",
  "validationErrors": [
    "API specification not found for endpoint /api/unknown"
  ]
}
```

**Email Delivery Failed:**
```json
{
  "success": true,
  "message": "Error report validated but email delivery failed. Report has been logged."
}
```

---

## Rate Limiting

Currently, the API does not implement rate limiting. For production deployments, consider adding rate limiting to prevent abuse:

**Recommended Limits:**
- `/api/error-reports`: 10 requests per minute per IP
- `/api/environments/status`: 60 requests per minute per IP
- `/api/health`: Unlimited

**Implementation Options:**
- express-rate-limit middleware
- nginx rate limiting
- API gateway rate limiting

---

## CORS Configuration

The API is configured to accept requests from any origin in development mode. For production, configure CORS to allow only trusted origins.

**Current Configuration (Development):**
```javascript
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
```

**Recommended Production Configuration:**
```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));
```

---

## Request/Response Examples

### Complete Error Report Submission Flow

**1. Submit Error Report:**

```bash
curl -X POST http://localhost:3000/api/error-reports \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/api/users",
    "method": "POST",
    "payload": {
      "name": "John Doe",
      "email": "john@example.com",
      "age": 30
    },
    "errorDescription": "Received 500 Internal Server Error when creating user. The server returned: Internal Server Error",
    "userContact": "developer@example.com"
  }'
```

**2. Validation Passes - Response:**

```json
{
  "success": true,
  "message": "Error report validated and email sent to investigation team"
}
```

**3. Investigation Team Receives Email:**

```
Subject: API Error Report: /api/users

API Endpoint: /api/users
HTTP Method: POST
Request Payload:
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}

Error Description:
Received 500 Internal Server Error when creating user. The server returned: Internal Server Error

User Contact: developer@example.com
Timestamp: 2024-01-15T10:30:45.123Z
Validation Status: Passed
```

---

## Testing the API

### Using curl

**Test Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Test Environment Status:**
```bash
curl http://localhost:3000/api/environments/status
```

**Test Error Report Submission:**
```bash
curl -X POST http://localhost:3000/api/error-reports \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/api/test",
    "method": "GET",
    "payload": {},
    "errorDescription": "Test error"
  }'
```

### Using Postman

1. Import the following collection:

```json
{
  "info": {
    "name": "API Error Logger",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Submit Error Report",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"endpoint\": \"/api/users\",\n  \"method\": \"POST\",\n  \"payload\": {\n    \"name\": \"John Doe\"\n  },\n  \"errorDescription\": \"Test error\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/error-reports",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "error-reports"]
        }
      }
    },
    {
      "name": "Get Environment Status",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:3000/api/environments/status",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "environments", "status"]
        }
      }
    },
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:3000/api/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "health"]
        }
      }
    }
  ]
}
```

### Using JavaScript/Axios

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// Submit error report
async function submitErrorReport(errorData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/error-reports`, errorData);
    return response.data;
  } catch (error) {
    console.error('Error submitting report:', error);
    throw error;
  }
}

// Get environment status
async function getEnvironmentStatus() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/environments/status`);
    return response.data;
  } catch (error) {
    console.error('Error fetching status:', error);
    throw error;
  }
}

// Health check
async function healthCheck() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`);
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

// Example usage
const errorReport = {
  endpoint: '/api/users',
  method: 'POST',
  payload: { name: 'John Doe', email: 'john@example.com' },
  errorDescription: 'User creation failed',
  userContact: 'developer@example.com'
};

submitErrorReport(errorReport)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Failed:', error));
```

---

## Versioning

Current API version: **v1** (implicit)

The API does not currently use explicit versioning in the URL. Future versions may use:
- URL versioning: `/api/v2/error-reports`
- Header versioning: `Accept: application/vnd.api-error-logger.v2+json`

---

## Changelog

### Version 1.0.0 (Current)

- Initial release
- POST /api/error-reports endpoint
- GET /api/environments/status endpoint
- GET /api/health endpoint
- Swagger validation support
- Email notification support
- Configuration hot-reload support
