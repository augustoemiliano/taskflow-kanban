import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type CreateTaskPayload,
  type TaskPriority,
  type TaskStatus,
  type UpdateTaskPayload
} from "../../types/task";
import { TaskApiError } from "../../utils/taskApiError";
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH, TITLE_MIN_LENGTH } from "../../utils/taskValidation";

/**
 * Mirror of backend/src/schemas/taskSchema.ts (Zod) for the demo adapter: same rules,
 * same messages and the same VALIDATION_ERROR envelope the API's error handler builds.
 */

type Issue = { field: string; message: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PRIORITY_MESSAGE = "A prioridade deve ser LOW, MEDIUM, HIGH ou URGENT.";
const STATUS_MESSAGE = "O status deve ser TODO, IN_PROGRESS, REVIEW ou DONE.";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const fail = (issues: Issue[]): never => {
  throw new TaskApiError(400, "VALIDATION_ERROR", "Existem campos inválidos na requisição.", issues);
};

const checkTitle = (value: unknown, issues: Issue[], requiredMessage: string): string | undefined => {
  if (typeof value !== "string") {
    issues.push({ field: "title", message: requiredMessage });
    return undefined;
  }
  const title = value.trim();
  if (title.length < TITLE_MIN_LENGTH) {
    issues.push({ field: "title", message: `O título deve ter no mínimo ${TITLE_MIN_LENGTH} caracteres.` });
  } else if (title.length > TITLE_MAX_LENGTH) {
    issues.push({ field: "title", message: `O título deve ter no máximo ${TITLE_MAX_LENGTH} caracteres.` });
  }
  return title;
};

const checkDescription = (value: unknown, issues: Issue[]): string | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    issues.push({ field: "description", message: "A descrição deve ser um texto." });
    return undefined;
  }
  const description = value.trim();
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    issues.push({
      field: "description",
      message: `A descrição deve ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres.`
    });
  }
  return description;
};

const checkEnum = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
  message: string,
  issues: Issue[]
): T | undefined => {
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  issues.push({ field, message });
  return undefined;
};

export const assertTaskId = (taskId: unknown): string => {
  if (typeof taskId !== "string" || !UUID_PATTERN.test(taskId)) {
    fail([{ field: "id", message: "ID de tarefa inválido." }]);
  }
  return taskId as string;
};

export const parseCreateTaskPayload = (input: unknown): CreateTaskPayload => {
  const body = isRecord(input) ? input : {};
  const issues: Issue[] = [];

  const title = checkTitle(body.title, issues, "O título é obrigatório.");
  const description = checkDescription(body.description, issues);
  const priority = checkEnum<TaskPriority>(body.priority, TASK_PRIORITIES, "priority", PRIORITY_MESSAGE, issues);

  if (issues.length > 0) {
    fail(issues);
  }

  return { title: title!, priority: priority!, ...(description !== undefined ? { description } : {}) };
};

export const parseUpdateTaskPayload = (input: unknown): UpdateTaskPayload => {
  const body = isRecord(input) ? input : {};
  const issues: Issue[] = [];
  const payload: UpdateTaskPayload = {};

  if (body.title !== undefined) {
    payload.title = checkTitle(body.title, issues, "O título deve ser um texto.");
  }
  if (body.description !== undefined) {
    payload.description = checkDescription(body.description, issues);
  }
  if (body.priority !== undefined) {
    payload.priority = checkEnum<TaskPriority>(body.priority, TASK_PRIORITIES, "priority", PRIORITY_MESSAGE, issues);
  }
  if (body.status !== undefined) {
    payload.status = checkEnum<TaskStatus>(body.status, TASK_STATUSES, "status", STATUS_MESSAGE, issues);
  }

  if (issues.length === 0 && Object.keys(payload).length === 0) {
    issues.push({ field: "", message: "Informe ao menos um campo para atualização." });
  }

  if (issues.length > 0) {
    fail(issues);
  }

  return payload;
};

export const parseTaskStatus = (input: unknown): TaskStatus => {
  const issues: Issue[] = [];
  const status = checkEnum<TaskStatus>(input, TASK_STATUSES, "status", STATUS_MESSAGE, issues);
  if (issues.length > 0) {
    fail(issues);
  }
  return status!;
};
