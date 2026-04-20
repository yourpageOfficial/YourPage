import axios from "axios";
import { useLocale } from "./use-locale";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const locale = useLocale.getState().locale;
  config.headers["Accept-Language"] = locale;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
