import api from './api';

/**
 * Submit an error report to the backend
 * @param {Object} errorData - The error report data
 * @param {string} errorData.endpoint - API endpoint path
 * @param {string} errorData.method - HTTP method
 * @param {Object} errorData.payload - Request payload
 * @param {string} errorData.errorDescription - Error description
 * @param {string} [errorData.userContact] - Optional user contact
 * @returns {Promise<Object>} Response with success status and message
 */
export const submitErrorReport = async (errorData) => {
  const response = await api.post('/error-reports', errorData);
  return response.data;
};
