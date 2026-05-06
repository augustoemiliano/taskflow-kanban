import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { AppError } from "../errors/AppError";

interface ValidateRequestSchemas {
  params?: ZodType;
  body?: ZodType;
}

export const validateRequest = ({ params, body }: ValidateRequestSchemas) => {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const validationErrors: { field: string; message: string }[] = [];

    const parseWithSchema = (
      schema: ZodType,
      data: unknown,
      source: "params" | "body"
    ): void => {
      const result = schema.safeParse(data);

      if (!result.success) {
        for (const issue of result.error.issues) {
          const path = issue.path.length > 0 ? issue.path.join(".") : source;
          validationErrors.push({ field: path, message: issue.message });
        }
        return;
      }

      if (source === "params") {
        request.params = result.data as Request["params"];
      }

      if (source === "body") {
        request.body = result.data as Request["body"];
      }
    };

    if (params) parseWithSchema(params, request.params, "params");
    if (body) parseWithSchema(body, request.body, "body");

    if (validationErrors.length > 0) {
      throw new AppError(400, "VALIDATION_ERROR", "Existem campos inválidos na requisição.", validationErrors);
    }

    next();
  };
};
