import type { Request, Response } from "express";

export const notFoundHandler = (_request: Request, response: Response): void => {
  response.status(404).json({
    success: false,
    error: {
      code: "RESOURCE_NOT_FOUND",
      message: "Rota não encontrada.",
      details: []
    }
  });
};
