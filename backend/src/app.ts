import express from "express";
import cors from "cors";
import { createCorsOptions } from "./config/cors";
import { errorHandler } from "./errors/errorHandler";
import { notFoundHandler } from "./middlewares/notFoundHandler";
import type { TaskRepository } from "./repositories/taskRepository";
import { createTaskRoutes } from "./routes/taskRoutes";
import { TaskService } from "./services/taskService";
import { TaskController } from "./controllers/taskController";

interface CreateAppOptions {
  taskRepository: TaskRepository;
  allowedOrigins: string[];
}

/**
 * Builds the Express application with its dependencies injected, so tests and
 * the real server can wire different repositories (memory vs. SQLite).
 */
export const createApp = ({ taskRepository, allowedOrigins }: CreateAppOptions) => {
  const taskService = new TaskService(taskRepository);
  const taskController = new TaskController(taskService);

  const app = express();

  app.disable("x-powered-by");
  app.use(cors(createCorsOptions(allowedOrigins)));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_request, response) => {
    response.status(200).json({ success: true, data: { status: "ok" } });
  });
  app.use("/api/tasks", createTaskRoutes(taskController));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
