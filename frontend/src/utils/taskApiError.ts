import type { ApiErrorResponse } from "../types/task";

type ErrorDetails = NonNullable<ApiErrorResponse["error"]["details"]>;

/**
 * Error raised by non-HTTP task adapters (e.g. the demo mode) with the same
 * `{ code, message, details }` shape the API returns, so the UI handles both alike.
 */
export class TaskApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: ErrorDetails;

  constructor(statusCode: number, code: string, message: string, details: ErrorDetails = []) {
    super(message);
    this.name = "TaskApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
