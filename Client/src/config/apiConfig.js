// Central configuration for API and server URLs.
// Set VITE_API_URL in your .env file for production deployments.
// Default: http://localhost:5000

export const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const API_BASE = `${SERVER_URL}/api`;
