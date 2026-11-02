import type { AxiosInstance } from "axios";
import type { ApiSuccessResponse, Task } from "../types/task";
import type { TaskApi } from "./taskApi";

export const createHttpTaskApi = (client: AxiosInstance): TaskApi => ({
  async getTasks() {
    const response = await client.get<ApiSuccessResponse<Task[]>>("/tasks");
    return response.data.data;
  },

  async getTaskById(taskId) {
    const response = await client.get<ApiSuccessResponse<Task>>(`/tasks/${taskId}`);
    return response.data.data;
  },

  async createTask(payload) {
    const response = await client.post<ApiSuccessResponse<Task>>("/tasks", payload);
    return response.data.data;
  },

  async updateTask(taskId, payload) {
    const response = await client.patch<ApiSuccessResponse<Task>>(`/tasks/${taskId}`, payload);
    return response.data.data;
  },

  async updateTaskStatus(taskId, status) {
    const response = await client.patch<ApiSuccessResponse<Task>>(`/tasks/${taskId}/status`, { status });
    return response.data.data;
  },

  async deleteTask(taskId) {
    await client.delete<ApiSuccessResponse<null>>(`/tasks/${taskId}`);
  }
});
