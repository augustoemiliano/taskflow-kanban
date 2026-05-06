import { randomUUID } from "node:crypto";
import type { CreateTaskDto } from "../dtos/createTaskDto";
import type { UpdateTaskDto } from "../dtos/updateTaskDto";
import { AppError } from "../errors/AppError";
import type { Task, TaskStatus } from "../models/task";
import type { TaskRepository } from "../repositories/taskRepository";
import { nowIsoString } from "../utils/date";

export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async listTasks(): Promise<Task[]> {
    return this.taskRepository.findAll();
  }

  async getTaskById(taskId: string): Promise<Task> {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new AppError(404, "TASK_NOT_FOUND", "Tarefa não encontrada.");
    }

    return task;
  }

  async createTask(taskData: CreateTaskDto): Promise<Task> {
    const timestamp = nowIsoString();

    const task: Task = {
      id: randomUUID(),
      title: taskData.title,
      description: taskData.description ?? "",
      status: "TODO",
      priority: taskData.priority,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    return this.taskRepository.create(task);
  }

  async updateTask(taskId: string, taskData: UpdateTaskDto): Promise<Task> {
    const existingTask = await this.getTaskById(taskId);

    const updatedTask: Task = {
      ...existingTask,
      ...taskData,
      description: taskData.description ?? existingTask.description,
      updatedAt: nowIsoString()
    };

    return this.taskRepository.update(updatedTask);
  }

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
    const existingTask = await this.getTaskById(taskId);

    const updatedTask: Task = {
      ...existingTask,
      status,
      updatedAt: nowIsoString()
    };

    return this.taskRepository.update(updatedTask);
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.getTaskById(taskId);
    await this.taskRepository.delete(taskId);
  }
}
