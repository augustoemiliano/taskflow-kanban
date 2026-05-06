import type { TaskPriority, TaskStatus } from "../models/task";

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}
