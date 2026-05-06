import { Router } from "express";
import { TaskController } from "../controllers/taskController";
import { validateRequest } from "../middlewares/validateRequest";
import {
  createTaskSchema,
  taskIdParamSchema,
  updateTaskSchema,
  updateTaskStatusSchema
} from "../schemas/taskSchema";

export const createTaskRoutes = (taskController: TaskController): Router => {
  const taskRoutes = Router();

  taskRoutes.get("/", taskController.listTasks);
  taskRoutes.get("/:id", validateRequest({ params: taskIdParamSchema }), taskController.getTaskById);
  taskRoutes.post("/", validateRequest({ body: createTaskSchema }), taskController.createTask);
  taskRoutes.patch(
    "/:id",
    validateRequest({ params: taskIdParamSchema, body: updateTaskSchema }),
    taskController.updateTask
  );
  taskRoutes.patch(
    "/:id/status",
    validateRequest({ params: taskIdParamSchema, body: updateTaskStatusSchema }),
    taskController.updateTaskStatus
  );
  taskRoutes.delete("/:id", validateRequest({ params: taskIdParamSchema }), taskController.deleteTask);

  return taskRoutes;
};
