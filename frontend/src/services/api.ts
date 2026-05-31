import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://internflow-backend-7n8i.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add access token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('internflow_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle errors and refresh expired access tokens automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If unauthorized (401) and we haven't retried this request yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('internflow_refresh_token');

      if (refreshToken) {
        try {
          // Attempt to refresh the access token using standard Axios to bypass custom interceptor loops
          const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = res.data.data;

          // Store new tokens in client-side storage
          localStorage.setItem('internflow_access_token', accessToken);
          localStorage.setItem('internflow_refresh_token', newRefreshToken);

          // Update authorization header with new valid access token and retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Clear storage on failed token refresh and redirect to re-authenticate
          console.error('Refresh token expired or invalid:', refreshError);
          localStorage.removeItem('internflow_access_token');
          localStorage.removeItem('internflow_refresh_token');
          localStorage.removeItem('internflow_user');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
