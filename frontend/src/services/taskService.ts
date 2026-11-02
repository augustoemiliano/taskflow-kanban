import { apiClient } from "./api";
import { getDemoTaskApi, isDemoMode } from "./demo/demoMode";
import { createHttpTaskApi } from "./httpTaskApi";
import type { TaskApi } from "./taskApi";

/**
 * Single place where the data source is chosen: the real API by default, or the
 * browser-only adapter when the app is built with `VITE_DEMO_MODE=true`.
 */
export const taskService: TaskApi = isDemoMode ? getDemoTaskApi() : createHttpTaskApi(apiClient);
