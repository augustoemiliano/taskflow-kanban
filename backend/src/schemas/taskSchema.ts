import { z } from "zod";
import { TASK_PRIORITIES, TASK_STATUSES } from "../models/task";

const requiredTitleValidation = z
  .string({ error: "O título é obrigatório." })
  .trim()
  .min(3, "O título deve ter no mínimo 3 caracteres.")
  .max(100, "O título deve ter no máximo 100 caracteres.");

const optionalDescriptionValidation = z
  .string({ error: "A descrição deve ser um texto." })
  .trim()
  .max(500, "A descrição deve ter no máximo 500 caracteres.")
  .optional();

const optionalTitleValidation = z
  .string({ error: "O título deve ser um texto." })
  .trim()
  .min(3, "O título deve ter no mínimo 3 caracteres.")
  .max(100, "O título deve ter no máximo 100 caracteres.")
  .optional();

export const taskIdParamSchema = z.object({
  id: z.uuid("ID de tarefa inválido.")
});

export const createTaskSchema = z.object({
  title: requiredTitleValidation,
  description: optionalDescriptionValidation,
  priority: z.enum(TASK_PRIORITIES, {
    error: "A prioridade deve ser LOW, MEDIUM, HIGH ou URGENT."
  })
});

export const updateTaskSchema = z
  .object({
    title: optionalTitleValidation,
    description: optionalDescriptionValidation,
    priority: z
      .enum(TASK_PRIORITIES, {
        error: "A prioridade deve ser LOW, MEDIUM, HIGH ou URGENT."
      })
      .optional(),
    status: z
      .enum(TASK_STATUSES, {
        error: "O status deve ser TODO, IN_PROGRESS, REVIEW ou DONE."
      })
      .optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "Informe ao menos um campo para atualização."
  });

export const updateTaskStatusSchema = z.object({
  status: z.enum(TASK_STATUSES, {
    error: "O status deve ser TODO, IN_PROGRESS, REVIEW ou DONE."
  })
});
