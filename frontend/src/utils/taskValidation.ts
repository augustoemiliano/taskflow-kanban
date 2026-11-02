import type { CreateTaskPayload, TaskPriority } from "../types/task";

export const TITLE_MIN_LENGTH = 3;
export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

export interface TaskFormErrors {
  title?: string;
  description?: string;
}

interface TaskFormInput {
  title: string;
  description: string;
  priority: TaskPriority;
}

/**
 * Client-side mirror of the API rules (backend/src/schemas/taskSchema.ts) for instant
 * feedback. The API remains the source of truth and validates again.
 */
export const validateTaskForm = (input: TaskFormInput) => {
  const payload: CreateTaskPayload = {
    title: input.title.trim(),
    description: input.description.trim(),
    priority: input.priority
  };

  const errors: TaskFormErrors = {};

  if (payload.title.length < TITLE_MIN_LENGTH || payload.title.length > TITLE_MAX_LENGTH) {
    errors.title = `O título deve ter entre ${TITLE_MIN_LENGTH} e ${TITLE_MAX_LENGTH} caracteres.`;
  }

  if ((payload.description ?? "").length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `A descrição deve ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres.`;
  }

  return { payload, errors, isValid: Object.keys(errors).length === 0 };
};
