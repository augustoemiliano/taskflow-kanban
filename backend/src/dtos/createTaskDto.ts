import type { TaskPriority } from "../models/task";

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority: TaskPriority;
}
