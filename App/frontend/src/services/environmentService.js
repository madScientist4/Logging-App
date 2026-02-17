import api from './api';

/**
 * Fetch environment status from the backend
 * @returns {Promise<Object>} Response with environments array
 */
export const fetchEnvironmentStatus = async () => {
  const response = await api.get('/environments/status');
  return response.data;
};
