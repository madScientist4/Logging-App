# Manual Testing Guide: Frontend-Backend Integration

This guide will help you verify that the frontend is properly connected to the backend.

## Prerequisites

Before testing, ensure you have:
1. Backend server running on port 3000
2. Frontend dev server running on port 5173

## Starting the Servers

### Terminal 1 - Backend Server
```bash
cd backend
npm start
```

You should see:
```
API Error Logger server running on port 3000
Environment: development
Health check: http://localhost:3000/api/health
```

### Terminal 2 - Frontend Dev Server
```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

## Test Cases

### Test 1: Verify Backend Health

Open your browser and navigate to:
```
http://localhost:3000/api/health
```

**Expected Result:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Test 2: View Frontend Application

Navigate to:
```
http://localhost:5173
```

**Expected Result:**
- Page loads successfully
- You see "API Error Logger" header
- Two navigation buttons: "Report Error" and "Environment Status"
- Error submission form is visible
- Environment status section is visible below

### Test 3: Test Environment Status Display

**Steps:**
1. Scroll to the "Environment Status" section
2. Observe the environment cards

**Expected Results:**
- You should see environment cards (Production, Staging, Development)
- Each card shows:
  - Environment name
  - Status badge (● Active or ● Inactive)
  - "Last checked: X seconds/minutes ago"
- Status should auto-refresh every 60 seconds

**If you see an error:**
- "Unable to connect to server..." → Backend is not running
- "No environments configured" → Check backend/config.json

### Test 4: Test Error Report Submission (Valid Request)

**Steps:**
1. Fill out the form:
   - **API Endpoint:** `/api/users`
   - **HTTP Method:** `POST`
   - **Request Payload:** 
     ```json
     {"name": "John Doe", "email": "john@example.com"}
     ```
   - **Error Description:** `Test error submission`
   - **Contact (optional):** `tester@example.com`

2. Click "Submit Error Report"

**Expected Results:**
- Button changes to "Submitting..."
- Loading indicator appears: "Validating your error report..."
- After a moment, you see one of:
  
  **Success (if Swagger spec is configured and valid):**
  ```
  ✓ Success!
  Email sent to investigation team
  ```
  
  **Validation Failure (if Swagger spec doesn't match):**
  ```
  ✗ Validation Failed
  [List of validation errors]
  ```

- Form clears after successful submission

### Test 5: Test Form Validation (Missing Fields)

**Steps:**
1. Leave all fields empty
2. Click "Submit Error Report"

**Expected Results:**
- Form does NOT submit
- Red error messages appear under each required field:
  - "API endpoint is required"
  - "HTTP method is required"
  - "Request payload is required"
  - "Error description is required"

### Test 6: Test JSON Validation

**Steps:**
1. Fill out the form
2. In **Request Payload**, enter invalid JSON:
   ```
   {invalid json}
   ```
3. Click "Submit Error Report"

**Expected Results:**
- Form does NOT submit
- Error message appears: "Payload must be valid JSON"

### Test 7: Test Network Error Handling

**Steps:**
1. Stop the backend server (Ctrl+C in Terminal 1)
2. In the frontend, try to submit an error report
3. Observe the environment status section

**Expected Results:**
- Error submission shows:
  ```
  ✗ Validation Failed
  Unable to connect to server. Please check your connection and ensure the backend is running.
  ```
- Environment status shows:
  ```
  Error: Unable to connect to server. Please check your connection and ensure the backend is running.
  ```

### Test 8: Test Navigation

**Steps:**
1. Click "Environment Status" button in the header
2. Page should smoothly scroll to the Environment Status section
3. Click "Report Error" button
4. Page should smoothly scroll back to the form

**Expected Results:**
- Smooth scrolling animation
- No page reload
- Active button is highlighted
- Navigation works without any console errors

### Test 9: Test Auto-Refresh

**Steps:**
1. Note the "Last checked" timestamp in the Environment Status section
2. Wait 60 seconds
3. Observe the timestamp

**Expected Results:**
- After 60 seconds, the timestamp updates automatically
- No page reload occurs
- Status indicators may change if environment status changed

### Test 10: Test Responsive Design

**Steps:**
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test different screen sizes:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)

**Expected Results:**
- Layout adapts to different screen sizes
- Form remains usable on mobile
- Environment cards stack properly on smaller screens
- Navigation buttons remain accessible

## Troubleshooting

### Backend Not Starting

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Find and kill the process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

### Frontend Not Loading

**Error:** `Failed to fetch`

**Solution:**
1. Check backend is running: `http://localhost:3000/api/health`
2. Check Vite proxy configuration in `frontend/vite.config.js`
3. Restart frontend dev server

### CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
1. Verify backend has `cors` middleware enabled (it should be)
2. Check backend console for CORS-related errors
3. Restart both servers

### Environment Status Not Loading

**Possible Issues:**
1. Backend not running → Start backend
2. No environments configured → Check `backend/config.json`
3. Health check URLs unreachable → Expected for example URLs

## Success Criteria

All tests pass if:
- ✓ Backend health check responds
- ✓ Frontend loads without errors
- ✓ Environment status displays (even if inactive)
- ✓ Error submission form validates input
- ✓ Error submission communicates with backend
- ✓ Network errors are handled gracefully
- ✓ Navigation works without page reload
- ✓ Auto-refresh works after 60 seconds

## Next Steps

After successful testing:
1. Configure real Swagger specifications in `backend/config.json`
2. Configure real environment health check URLs
3. Set up SMTP email configuration in `backend/.env`
4. Test with real API endpoints
5. Deploy to production environment

## Requirements Validated

This testing validates:
- **Requirement 1.2**: Error request data capture
- **Requirement 1.3**: Immediate feedback on submission
- **Requirement 4.1**: Success message display
- **Requirement 4.2**: Validation error display
- **Requirement 5.2**: Environment status display with real data
