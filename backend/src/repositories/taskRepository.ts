import type { Task } from "../models/task";

export interface TaskRepository {
  findAll(): Promise<Task[]>;
  findById(taskId: string): Promise<Task | null>;
  create(task: Task): Promise<Task>;
  update(task: Task): Promise<Task>;
  delete(taskId: string): Promise<void>;
}
