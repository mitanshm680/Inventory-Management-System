import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Get API port from environment variable or use default
const API_PORT = process.env.REACT_APP_API_PORT || '8005';
const BASE_URL = process.env.REACT_APP_API_URL || `http://localhost:${API_PORT}`;

console.log('API Base URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false // Disable sending cookies for cross-origin requests
});

// Add token to requests if available
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 