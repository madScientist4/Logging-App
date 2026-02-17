# API Error Logger - Frontend

React-based frontend application for the API Error Logger system.

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── ErrorSubmissionForm.jsx    # Error report submission form
│   │   ├── EnvironmentStatus.jsx      # Environment status dashboard
│   │   └── components.css             # Shared component styles
│   ├── services/            # API service layer
│   │   ├── api.js                     # Axios instance configuration
│   │   ├── errorReportService.js      # Error report API calls
│   │   └── environmentService.js      # Environment status API calls
│   ├── App.jsx              # Main application component
│   ├── App.css              # Application styles
│   ├── main.jsx             # Application entry point
│   └── index.css            # Global styles
├── index.html               # HTML template
├── vite.config.js           # Vite configuration
└── package.json             # Dependencies and scripts
```

## Technology Stack

- **React 18**: UI library
- **Vite**: Build tool and dev server
- **Axios**: HTTP client for API calls
- **Vitest**: Testing framework
- **fast-check**: Property-based testing

## Development

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Running Tests

```bash
npm test
```

## API Configuration

The frontend is configured to proxy API requests to the backend server running on `http://localhost:3000`. This is configured in `vite.config.js`.

All API calls are made through the services layer:
- `errorReportService.js` - Submit error reports
- `environmentService.js` - Fetch environment status

## Features

### Error Submission
- Form for submitting API error reports
- Client-side validation
- Real-time feedback on submission status
- Loading indicators during processing

### Environment Monitoring
- Real-time display of API environment status
- Auto-refresh every 60 seconds
- Visual indicators for active/inactive status

## Responsive Design

The application is fully responsive and supports:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
