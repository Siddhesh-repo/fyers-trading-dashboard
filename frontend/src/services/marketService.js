import apiClient from './api';

/**
 * Market Data service — all Axios calls for the market data endpoints.
 * Backend base: /api/v1/market/
 */

/**
 * Fetch LTP for a single symbol.
 * @param {string} symbol - e.g. "NSE:SBIN-EQ"
 */
export const getLtp = async (symbol) => {
  const response = await apiClient.get('/api/v1/market/ltp', {
    params: { symbol },
  });
  return response.data;
};

/**
 * Fetch LTP for the hardcoded watchlist of 10 symbols.
 */
export const getLtpMultiple = async () => {
  const response = await apiClient.get('/api/v1/market/ltp-multiple');
  return response.data;
};

/**
 * Fetch historical OHLCV candle data.
 * @param {string} symbol
 * @param {string} resolution - "D", "W", "M" or "1","5","15","30","60","240"
 * @param {number} from - Unix epoch start (seconds)
 * @param {number} to   - Unix epoch end (seconds)
 */
export const getHistory = async (symbol, resolution, from, to) => {
  const response = await apiClient.get('/api/v1/market/history', {
    params: { symbol, resolution, from, to },
  });
  return response.data;
};

/**
 * Fetch Level 2 market depth for a symbol.
 * @param {string} symbol - e.g. "NSE:SBIN-EQ"
 */
export const getDepth = async (symbol) => {
  const response = await apiClient.get('/api/v1/market/depth', {
    params: { symbol },
  });
  return response.data;
};
