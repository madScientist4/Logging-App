# Product Overview

API Error Logger is a web application that enables users to report errors encountered when consuming APIs. The system validates submitted error requests against Swagger/OpenAPI specifications and notifies the investigation team when valid errors are reported.

## Core Features

- Error report submission with Swagger/OpenAPI validation
- Email notifications to investigation team for validated errors
- Real-time environment health monitoring
- Configuration hot-reload without server restart
- Structured JSON logging with request tracing

## Architecture

Full-stack application with:
- Backend: Express.js REST API server
- Frontend: React SPA with Vite
- Communication: RESTful API with JSON payloads
- Configuration: JSON config file + environment variables

## Key Workflows

1. User submits error report via web form
2. Backend validates request against Swagger spec
3. If valid, email sent to investigation team
4. User receives immediate feedback (success or validation errors)
5. Environment status monitored continuously and displayed in real-time
