import axios from "axios";

const DEFAULT_DEV_API_BASE_URL = "http://localhost:3333/api";

const resolveApiBaseUrl = (): string => {
  const fromEnv = import.meta.env.VITE_API_URL;

  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }

  if (import.meta.env.DEV) {
    return DEFAULT_DEV_API_BASE_URL;
  }

  throw new Error(
    "Defina VITE_API_URL no .env antes do build (copie frontend/.env.example). Ex.: VITE_API_URL=http://localhost:3333/api"
  );
};

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    "Content-Type": "application/json"
  }
});
