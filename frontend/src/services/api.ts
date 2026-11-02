import axios from "axios";

const DEFAULT_DEV_API_BASE_URL = "http://localhost:3333/api";
// In production builds without VITE_API_URL we assume the API is served on the
// same origin under /api (e.g. behind the nginx reverse proxy in docker-compose).
const DEFAULT_PROD_API_BASE_URL = "/api";

export const resolveApiBaseUrl = (env: { VITE_API_URL?: string; DEV: boolean }): string => {
  const fromEnv = env.VITE_API_URL;

  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim().replace(/\/+$/, "");
  }

  return env.DEV ? DEFAULT_DEV_API_BASE_URL : DEFAULT_PROD_API_BASE_URL;
};

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(import.meta.env),
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json"
  }
});
