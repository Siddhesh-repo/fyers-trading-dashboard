import apiClient from './api';

/**
 * Service function to fetch backend API health status.
 * Primary endpoint: GET /api/v1/health (with fallback to GET /health)
 * 
 * @returns {Promise<Object>} The health payload containing status, app_name, environment, timestamp.
 */
export const fetchHealthStatus = async () => {
  try {
    const response = await apiClient.get('/api/v1/health');
    return response.data;
  } catch (error) {
    // Fallback probe to root alias endpoint
    const fallbackResponse = await apiClient.get('/health');
    return fallbackResponse.data;
  }
};
