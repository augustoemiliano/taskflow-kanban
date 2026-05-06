import { PRIORITY_ORDER } from "../constants/task";
import type { Task, TaskPriority, TaskStatus } from "../types/task";

export const formatTaskDate = (isoDate: string): string =>
  new Date(isoDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

export const matchesTaskFilters = (
  task: Task,
  searchTerm: string,
  selectedPriority: TaskPriority | "ALL"
): boolean => {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const matchesText =
    normalizedSearchTerm.length === 0 ||
    task.title.toLowerCase().includes(normalizedSearchTerm) ||
    task.description.toLowerCase().includes(normalizedSearchTerm);

  const matchesPriority = selectedPriority === "ALL" || task.priority === selectedPriority;

  return matchesText && matchesPriority;
};

export const sortTasksByPriorityAndDate = (tasks: Task[]): Task[] =>
  [...tasks].sort((leftTask, rightTask) => {
    const priorityDiff = PRIORITY_ORDER[rightTask.priority] - PRIORITY_ORDER[leftTask.priority];

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return rightTask.updatedAt.localeCompare(leftTask.updatedAt);
  });

export const countTasksByStatus = (tasks: Task[]): Record<TaskStatus, number> => {
  return tasks.reduce<Record<TaskStatus, number>>(
    (accumulator, task) => {
      accumulator[task.status] += 1;
      return accumulator;
    },
    {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0
    }
  );
};
