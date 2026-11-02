import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "./AppError";

interface HttpParserError {
  type: string;
  status?: number;
}

/**
 * Errors thrown by `express.json()` (body-parser) carry a `type` field.
 * Without this check, a malformed JSON body would end up as a 500.
 */
const isBodyParserError = (error: unknown): error is HttpParserError =>
  typeof error === "object" &&
  error !== null &&
  "type" in error &&
  typeof (error as { type: unknown }).type === "string";

const sendError = (
  response: Response,
  statusCode: number,
  code: string,
  message: string,
  details: AppError["details"] = []
): void => {
  response.status(statusCode).json({
    success: false,
    error: { code, message, details }
  });
};

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
): void => {
  if (error instanceof AppError) {
    sendError(response, error.statusCode, error.code, error.message, error.details);
    return;
  }

  if (error instanceof ZodError) {
    sendError(
      response,
      400,
      "VALIDATION_ERROR",
      "Existem campos inválidos na requisição.",
      error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    );
    return;
  }

  if (isBodyParserError(error)) {
    if (error.type === "entity.parse.failed") {
      sendError(response, 400, "INVALID_JSON", "O corpo da requisição não é um JSON válido.");
      return;
    }

    if (error.type === "entity.too.large") {
      sendError(response, 413, "PAYLOAD_TOO_LARGE", "O corpo da requisição excede o tamanho permitido.");
      return;
    }

    if (error.status && error.status >= 400 && error.status < 500) {
      sendError(response, error.status, "BAD_REQUEST", "Requisição inválida.");
      return;
    }
  }

  // Unexpected error: log on the server, but never leak internals to the client.
  console.error("[unhandled-error]", error);

  sendError(response, 500, "INTERNAL_SERVER_ERROR", "Erro interno do servidor.");
};
