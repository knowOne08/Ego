// API Configuration
const getApiBaseUrl = () => {
  // Check if we're in development or production
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3003/api';
  }
  
  // Production URL - replace with your Oracle server IP or domain
  return process.env.REACT_APP_API_URL || 'http://YOUR_ORACLE_SERVER_IP:3003/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_KEY = process.env.REACT_APP_API_KEY || 'hello123';
