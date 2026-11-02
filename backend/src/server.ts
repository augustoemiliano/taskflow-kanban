import { env } from "./config/env";
import { createApp } from "./app";
import { createTaskRepository } from "./repositories/createTaskRepository";

const { repository, close } = createTaskRepository(env);
const app = createApp({ taskRepository: repository, allowedOrigins: env.FRONTEND_URL });

const server = app.listen(env.PORT, "0.0.0.0", () => {
  // Intentionally no sensitive runtime data in logs.
  process.stdout.write(`Taskflow API running on port ${env.PORT} (storage: ${env.DATABASE_DRIVER})\n`);
});

const shutdown = (signal: string) => {
  process.stdout.write(`Received ${signal}, shutting down...\n`);
  server.close(() => {
    close();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
