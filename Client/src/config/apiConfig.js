// Central configuration for API and server URLs.
// Supports VITE_API_BASE or VITE_API_URL for custom endpoints.
// Automatically falls back to window.location.origin in production (same domain).
// Falls back to http://localhost:5000 in local development.

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined") {
    // If running in development (e.g. Vite dev server on port 5173 or 3000), point to localhost:5000 backend
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      if (window.location.port === "5173" || window.location.port === "3000") {
        return "http://localhost:5000";
      }
    }
    // In production or any deployed domain (like Render), use current domain origin
    return window.location.origin;
  }
  return "http://localhost:5000";
};

const rawBase = getBaseUrl();
export const SERVER_URL = rawBase.replace(/\/api\/?$/, "");
export const API_BASE = `${SERVER_URL}/api`;
