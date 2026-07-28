import apiClient from './api';

export const getLoginUrl = async () => {
  const response = await apiClient.get('/api/v1/auth/login');
  return response.data;
};

export const getAuthStatus = async () => {
  const response = await apiClient.get('/api/v1/auth/status');
  return response.data;
};
