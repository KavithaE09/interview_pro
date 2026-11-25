import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('interviewpro_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const path = window.location.pathname;

    if (status === 401) {
      // Admin panel → redirect to admin login
      if (path.startsWith('/admin') && !path.includes('/login')) {
        localStorage.removeItem('interviewpro_token');
        localStorage.removeItem('interviewpro_user');
        window.location.href = '/admin/login';
      }
      // Candidate pages → redirect to candidate login
      else if (path.startsWith('/candidate') && !path.includes('/login')) {
        localStorage.removeItem('interviewpro_token');
        localStorage.removeItem('interviewpro_user');
        window.location.href = '/candidate/login';
      }
    }
    // 500/network errors: just reject, don't force logout
    return Promise.reject(error);
  }
);

export default api;
