import axios from "axios";
import { API_BASE } from "../config/apiConfig";

const api = axios.create({
  baseURL: API_BASE,
});

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`; // Use Bearer scheme
      config.headers["x-auth-token"] = token; // Keep for backward compatibility
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh and retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Network error retry logic
    if (!error.response && !originalRequest._retryCount) {
      originalRequest._retryCount = 1;
      return new Promise((resolve) => {
        setTimeout(() => resolve(api(originalRequest)), 1000);
      });
    }

    // Token expiration refresh logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if the request was to login or refresh itself
      if (originalRequest.url.includes("/auth/login") || originalRequest.url.includes("/auth/refresh-token")) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Attempt to refresh token using httpOnly cookie
        const res = await axios.post(
          `${API_BASE}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
          // Update headers on original request and retry
          originalRequest.headers["Authorization"] = `Bearer ${res.data.token}`;
          originalRequest.headers["x-auth-token"] = res.data.token;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed (e.g. refresh token also expired)
        localStorage.removeItem("token");
        window.location.href = "/login?expired=1";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
