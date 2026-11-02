import type { Task } from "../types/task";

let sequence = 0;

export const buildTask = (overrides: Partial<Task> = {}): Task => {
  sequence += 1;
  return {
    id: `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`,
    title: `Tarefa ${sequence}`,
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
    ...overrides
  };
};
