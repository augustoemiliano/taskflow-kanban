import type { CorsOptions } from "cors";

export const createCorsOptions = (allowedOrigins: string[]): CorsOptions => ({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  credentials: false
});
