import React, { useState } from 'react';
import { submitErrorReport } from '../services/errorReportService';
import './components.css';

/**
 * ErrorSubmissionForm Component
 * 
 * Allows users to submit API error reports with validation.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.5
 */
function ErrorSubmissionForm() {
  const [formData, setFormData] = useState({
    endpoint: '',
    method: 'GET',
    payload: '',
    errorDescription: '',
    userContact: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.endpoint.trim()) {
      newErrors.endpoint = 'API endpoint is required';
    }

    if (!formData.method.trim()) {
      newErrors.method = 'HTTP method is required';
    }

    if (!formData.payload.trim()) {
      newErrors.payload = 'Request payload is required';
    } else {
      // Validate JSON format
      try {
        JSON.parse(formData.payload);
      } catch (e) {
        newErrors.payload = 'Payload must be valid JSON';
      }
    }

    if (!formData.errorDescription.trim()) {
      newErrors.errorDescription = 'Error description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous validation result
    setValidationResult(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse payload as JSON
      const payload = JSON.parse(formData.payload);

      // Submit error report
      const result = await submitErrorReport({
        endpoint: formData.endpoint.trim(),
        method: formData.method,
        payload: payload,
        errorDescription: formData.errorDescription.trim(),
        userContact: formData.userContact.trim() || undefined
      });

      // Display success result
      setValidationResult({
        success: true,
        message: result.message || 'Error report submitted successfully'
      });

      // Clear form after successful submission
      setFormData({
        endpoint: '',
        method: 'GET',
        payload: '',
        errorDescription: '',
        userContact: ''
      });
    } catch (error) {
      // Display error result
      const errorData = error.response?.data;
      
      // Handle network errors specifically
      if (!error.response) {
        setValidationResult({
          success: false,
          message: 'Unable to connect to server. Please check your connection and ensure the backend is running.',
          validationErrors: []
        });
      } else if (error.response.status >= 500) {
        setValidationResult({
          success: false,
          message: 'Server error occurred. Please try again later.',
          validationErrors: []
        });
      } else {
        setValidationResult({
          success: false,
          message: errorData?.message || 'Failed to submit error report',
          validationErrors: errorData?.validationErrors || []
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="error-submission-form">
      <div className="card">
        <h2 className="card-title">Submit API Error Report</h2>
        
        {/* Validation Result Display */}
        {validationResult && (
          <div className={`alert ${validationResult.success ? 'alert-success' : 'alert-error'}`}>
            <strong>{validationResult.success ? 'Success!' : 'Validation Failed'}</strong>
            <p>{validationResult.message}</p>
            {validationResult.validationErrors && validationResult.validationErrors.length > 0 && (
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                {validationResult.validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* API Endpoint Field */}
          <div className="form-group">
            <label htmlFor="endpoint" className="form-label">
              API Endpoint *
            </label>
            <input
              type="text"
              id="endpoint"
              name="endpoint"
              className="form-input"
              value={formData.endpoint}
              onChange={handleChange}
              placeholder="/api/users"
              disabled={isSubmitting}
            />
            {errors.endpoint && (
              <div className="form-error">{errors.endpoint}</div>
            )}
            <div className="form-help">The API endpoint path (e.g., /api/users)</div>
          </div>

          {/* HTTP Method Field */}
          <div className="form-group">
            <label htmlFor="method" className="form-label">
              HTTP Method *
            </label>
            <select
              id="method"
              name="method"
              className="form-select"
              value={formData.method}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
            {errors.method && (
              <div className="form-error">{errors.method}</div>
            )}
          </div>

          {/* Request Payload Field */}
          <div className="form-group">
            <label htmlFor="payload" className="form-label">
              Request Payload *
            </label>
            <textarea
              id="payload"
              name="payload"
              className="form-textarea"
              value={formData.payload}
              onChange={handleChange}
              placeholder='{"key": "value"}'
              disabled={isSubmitting}
              rows="6"
            />
            {errors.payload && (
              <div className="form-error">{errors.payload}</div>
            )}
            <div className="form-help">The request body in JSON format</div>
          </div>

          {/* Error Description Field */}
          <div className="form-group">
            <label htmlFor="errorDescription" className="form-label">
              Error Description *
            </label>
            <textarea
              id="errorDescription"
              name="errorDescription"
              className="form-textarea"
              value={formData.errorDescription}
              onChange={handleChange}
              placeholder="Describe the error you encountered..."
              disabled={isSubmitting}
              rows="4"
            />
            {errors.errorDescription && (
              <div className="form-error">{errors.errorDescription}</div>
            )}
            <div className="form-help">Describe the error you encountered</div>
          </div>

          {/* User Contact Field (Optional) */}
          <div className="form-group">
            <label htmlFor="userContact" className="form-label">
              Your Contact Information (Optional)
            </label>
            <input
              type="text"
              id="userContact"
              name="userContact"
              className="form-input"
              value={formData.userContact}
              onChange={handleChange}
              placeholder="email@example.com"
              disabled={isSubmitting}
            />
            <div className="form-help">Optional: Your email or contact information</div>
          </div>

          {/* Submit Button with Loading Indicator */}
          <div className="form-group">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%' }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Error Report'}
            </button>
          </div>

          {/* Loading Indicator */}
          {isSubmitting && (
            <div className="loading-container">
              <div className="loading-text">Validating your error report...</div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default ErrorSubmissionForm;
