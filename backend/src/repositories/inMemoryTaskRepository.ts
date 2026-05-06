import type { Task } from "../models/task";
import type { TaskRepository } from "./taskRepository";

export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<string, Task>();

  async findAll(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort((firstTask, secondTask) =>
      secondTask.updatedAt.localeCompare(firstTask.updatedAt)
    );
  }

  async findById(taskId: string): Promise<Task | null> {
    return this.tasks.get(taskId) ?? null;
  }

  async create(task: Task): Promise<Task> {
    this.tasks.set(task.id, task);
    return task;
  }

  async update(task: Task): Promise<Task> {
    this.tasks.set(task.id, task);
    return task;
  }

  async delete(taskId: string): Promise<void> {
    this.tasks.delete(taskId);
  }
}
