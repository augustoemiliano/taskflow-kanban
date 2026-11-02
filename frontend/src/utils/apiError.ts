import axios from "axios";
import type { ApiErrorResponse } from "../types/task";
import { TaskApiError } from "./taskApiError";

export const GENERIC_ERROR_MESSAGE = "Não foi possível concluir a ação. Tente novamente.";
export const NETWORK_ERROR_MESSAGE =
  "Não foi possível conectar à API. Verifique se o back-end está rodando e tente novamente.";

/**
 * Extracts a user-friendly message from an API/network error, following the
 * backend's `{ success: false, error: { message } }` contract.
 */
export const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof TaskApiError) {
    return error.message;
  }

  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const apiMessage = error.response?.data?.error?.message;

    if (typeof apiMessage === "string" && apiMessage.length > 0) {
      return apiMessage;
    }

    if (!error.response) {
      return NETWORK_ERROR_MESSAGE;
    }
  }

  return GENERIC_ERROR_MESSAGE;
};
