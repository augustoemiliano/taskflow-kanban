import type { CreateTaskPayload, Task, TaskStatus, UpdateTaskPayload } from "../types/task";

/**
 * Contract of the task data source used by the UI. The HTTP adapter talks to the
 * Express API; the demo adapter implements the same contract on top of the browser
 * storage (used by the static GitHub Pages build).
 */
export interface TaskApi {
  getTasks(): Promise<Task[]>;
  getTaskById(taskId: string): Promise<Task>;
  createTask(payload: CreateTaskPayload): Promise<Task>;
  updateTask(taskId: string, payload: UpdateTaskPayload): Promise<Task>;
  updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;
}
