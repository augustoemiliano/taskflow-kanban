import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors";
import { errorHandler } from "./errors/errorHandler";
import { notFoundHandler } from "./middlewares/notFoundHandler";
import { InMemoryTaskRepository } from "./repositories/inMemoryTaskRepository";
import { createTaskRoutes } from "./routes/taskRoutes";
import { TaskService } from "./services/taskService";
import { TaskController } from "./controllers/taskController";

const app = express();
const taskRepository = new InMemoryTaskRepository();
const taskService = new TaskService(taskRepository);
const taskController = new TaskController(taskService);

app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/tasks", createTaskRoutes(taskController));
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
