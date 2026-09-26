// Central configuration for API and server URLs.
// Supports VITE_API_URL or VITE_API_BASE for production deployments.
// Default: http://localhost:5000

const rawBase = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || "http://localhost:5000";
export const SERVER_URL = rawBase.replace(/\/api\/?$/, "");
export const API_BASE = `${SERVER_URL}/api`;
