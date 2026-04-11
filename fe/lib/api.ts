import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  withCredentials: true,
});

// Simple 401 handler — only redirect for non-auth API calls
api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Never auto-redirect — let each page handle auth errors
    return Promise.reject(error);
  }
);

export default api;
