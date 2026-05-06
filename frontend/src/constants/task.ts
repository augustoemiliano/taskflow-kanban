import type { TaskPriority, TaskStatus } from "../types/task";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "A Fazer",
  IN_PROGRESS: "Em Andamento",
  REVIEW: "Em Revisão",
  DONE: "Concluído"
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente"
};

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  LOW: "bg-sky-50 text-sky-700 border-sky-200",
  MEDIUM: "bg-emerald-50 text-emerald-700 border-emerald-200",
  HIGH: "bg-amber-50 text-amber-700 border-amber-200",
  URGENT: "bg-rose-50 text-rose-700 border-rose-200"
};
