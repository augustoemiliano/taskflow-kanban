import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const DEFAULT_DEV_FRONTEND_URL = "http://localhost:5173";

/**
 * CORS origin must be explicit in production. In development/test, if FRONTEND_URL
 * is missing, we default to the Vite dev server so `npm run dev` works after only
 * copying partial .env files.
 */
const envSchema = z.preprocess((rawEnv) => {
  const record = rawEnv as NodeJS.ProcessEnv;
  const nodeEnv = record.NODE_ENV ?? "development";

  if (!record.FRONTEND_URL && nodeEnv !== "production") {
    return { ...record, FRONTEND_URL: DEFAULT_DEV_FRONTEND_URL };
  }

  return record;
}, z.object({
  PORT: z.coerce.number().int().positive().default(3333),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  FRONTEND_URL: z
    .string({ error: "Defina FRONTEND_URL no .env (copie de .env.example)." })
    .trim()
    .url("FRONTEND_URL deve ser uma URL válida (ex.: http://localhost:5173).")
}));

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");
  throw new Error(
    `Variáveis de ambiente inválidas. Copie backend/.env.example para backend/.env e ajuste. Detalhes: ${details}`
  );
}

export const env = parsedEnv.data;
