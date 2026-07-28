import axios from 'axios';

// Determine default API base URL (falls back to local backend server)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Centrally configured Axios instance with base URL, timeout, and standard headers.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Axios response interceptor for unified response handling & logging
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMsg = error.response?.data?.message || error.message || 'Network error occurred';
    console.error('[Axios API Client Error]:', errorMsg);
    return Promise.reject(error);
  }
);

export default apiClient;
