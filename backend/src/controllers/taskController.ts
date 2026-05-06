import type { Request, Response } from "express";
import type { TaskService } from "../services/taskService";

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  private getTaskIdFromRequest(request: Request): string {
    const taskId = request.params.id;
    return Array.isArray(taskId) ? taskId[0] : taskId;
  }

  listTasks = async (_request: Request, response: Response): Promise<void> => {
    const tasks = await this.taskService.listTasks();
    response.status(200).json({ success: true, data: tasks });
  };

  getTaskById = async (request: Request, response: Response): Promise<void> => {
    const task = await this.taskService.getTaskById(this.getTaskIdFromRequest(request));
    response.status(200).json({ success: true, data: task });
  };

  createTask = async (request: Request, response: Response): Promise<void> => {
    const task = await this.taskService.createTask(request.body);
    response.status(201).json({ success: true, data: task });
  };

  updateTask = async (request: Request, response: Response): Promise<void> => {
    const task = await this.taskService.updateTask(this.getTaskIdFromRequest(request), request.body);
    response.status(200).json({ success: true, data: task });
  };

  updateTaskStatus = async (request: Request, response: Response): Promise<void> => {
    const task = await this.taskService.updateTaskStatus(this.getTaskIdFromRequest(request), request.body.status);
    response.status(200).json({ success: true, data: task });
  };

  deleteTask = async (request: Request, response: Response): Promise<void> => {
    await this.taskService.deleteTask(this.getTaskIdFromRequest(request));
    response.status(200).json({ success: true, data: null });
  };
}
