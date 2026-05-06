import { apiClient } from "./api";
import type { ApiSuccessResponse, CreateTaskPayload, Task, TaskStatus, UpdateTaskPayload } from "../types/task";

export const taskService = {
  async getTasks(): Promise<Task[]> {
    const response = await apiClient.get<ApiSuccessResponse<Task[]>>("/tasks");
    return response.data.data;
  },

  async getTaskById(taskId: string): Promise<Task> {
    const response = await apiClient.get<ApiSuccessResponse<Task>>(`/tasks/${taskId}`);
    return response.data.data;
  },

  async createTask(payload: CreateTaskPayload): Promise<Task> {
    const response = await apiClient.post<ApiSuccessResponse<Task>>("/tasks", payload);
    return response.data.data;
  },

  async updateTask(taskId: string, payload: UpdateTaskPayload): Promise<Task> {
    const response = await apiClient.patch<ApiSuccessResponse<Task>>(`/tasks/${taskId}`, payload);
    return response.data.data;
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
    const response = await apiClient.patch<ApiSuccessResponse<Task>>(`/tasks/${taskId}/status`, { status });
    return response.data.data;
  },

  async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete<ApiSuccessResponse<null>>(`/tasks/${taskId}`);
  }
};
