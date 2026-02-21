import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor - attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - normalize ALL error responses to string messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      const data = error.response.data;
      let msg;

      if (typeof data === 'string') {
        msg = data;
      } else if (typeof data?.error?.message === 'string') {
        msg = data.error.message;
      } else if (typeof data?.error === 'string') {
        msg = data.error;
      } else if (typeof data?.message?.message === 'string') {
        msg = data.message.message;
      } else if (typeof data?.message === 'string') {
        msg = data.message;
      } else {
        try { msg = JSON.stringify(data); } catch { msg = 'Unknown error'; }
      }

      // Overwrite response data with normalized shape
      error.response.data = { message: msg };
    }

    return Promise.reject(error);
  }
);

export default api;
