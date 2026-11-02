import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const DEFAULT_DEV_FRONTEND_URL = "http://localhost:5173";

const originListSchema = z
  .string({ error: "Defina FRONTEND_URL no .env (copie de .env.example)." })
  .trim()
  .transform((value) =>
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0)
  )
  .pipe(
    z
      .array(z.url("FRONTEND_URL deve conter URLs válidas (ex.: http://localhost:5173)."))
      .min(1, "Defina ao menos uma origem em FRONTEND_URL.")
  );

/**
 * CORS origin must be explicit in production. In development/test, if FRONTEND_URL
 * is missing, we default to the Vite dev server so `npm run dev` works after only
 * copying partial .env files.
 *
 * DATABASE_DRIVER selects the TaskRepository implementation:
 * - `sqlite` (default): persists to DATABASE_PATH using Node's built-in `node:sqlite`.
 * - `memory`: volatile storage, used by automated tests (default when NODE_ENV=test).
 */
const envSchema = z.preprocess(
  (rawEnv) => {
    const record = { ...(rawEnv as NodeJS.ProcessEnv) };
    const nodeEnv = record.NODE_ENV ?? "development";

    if (!record.FRONTEND_URL && nodeEnv !== "production") {
      record.FRONTEND_URL = DEFAULT_DEV_FRONTEND_URL;
    }

    if (!record.DATABASE_DRIVER && nodeEnv === "test") {
      record.DATABASE_DRIVER = "memory";
    }

    return record;
  },
  z.object({
    PORT: z.coerce.number().int().positive().default(3333),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    FRONTEND_URL: originListSchema,
    DATABASE_DRIVER: z
      .enum(["sqlite", "memory"], { error: "DATABASE_DRIVER deve ser 'sqlite' ou 'memory'." })
      .default("sqlite"),
    DATABASE_PATH: z.string().trim().min(1).default("data/taskflow.db")
  })
);

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
export type Env = typeof env;
