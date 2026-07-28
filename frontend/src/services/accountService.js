import apiClient from './api';

/**
 * Account Information service — Axios functions for Stage 4 endpoints.
 * Backend prefix: /api/v1/account/
 */

/**
 * Fetch available and utilized funds/balances.
 */
export const getFunds = async () => {
  const response = await apiClient.get('/api/v1/account/funds');
  return response.data;
};

/**
 * Fetch user equity holdings.
 */
export const getHoldings = async () => {
  const response = await apiClient.get('/api/v1/account/holdings');
  return response.data;
};

/**
 * Fetch user net positions.
 */
export const getPositions = async () => {
  const response = await apiClient.get('/api/v1/account/positions');
  return response.data;
};

/**
 * Fetch user order book history.
 */
export const getOrders = async () => {
  const response = await apiClient.get('/api/v1/account/orders');
  return response.data;
};
