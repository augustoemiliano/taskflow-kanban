import { PRIORITY_ORDER } from "../constants/task";
import { TASK_STATUSES, type Task, type TaskPriority, type TaskStatus } from "../types/task";

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

const createEmptyStatusRecord = <T>(factory: () => T): Record<TaskStatus, T> => ({
  TODO: factory(),
  IN_PROGRESS: factory(),
  REVIEW: factory(),
  DONE: factory()
});

export const countTasksByStatus = (tasks: Task[]): Record<TaskStatus, number> =>
  tasks.reduce<Record<TaskStatus, number>>((accumulator, task) => {
    accumulator[task.status] += 1;
    return accumulator;
  }, createEmptyStatusRecord(() => 0));

export const groupTasksByStatus = (tasks: Task[]): Record<TaskStatus, Task[]> =>
  tasks.reduce<Record<TaskStatus, Task[]>>((accumulator, task) => {
    accumulator[task.status].push(task);
    return accumulator;
  }, createEmptyStatusRecord<Task[]>(() => []));

export const isTaskStatus = (value: unknown): value is TaskStatus =>
  typeof value === "string" && (TASK_STATUSES as readonly string[]).includes(value);

/**
 * DndKit may report `over.id` as the column droppable (TODO, IN_PROGRESS, …) or as
 * a sortable task id (UUID) when the pointer releases over a card. Both must map
 * to a target column status, otherwise dropping over a card would send an invalid
 * status to the API.
 */
export const resolveDropTargetStatus = (overId: string | number, allTasks: Task[]): TaskStatus | null => {
  const overIdString = String(overId);

  if (isTaskStatus(overIdString)) {
    return overIdString;
  }

  const targetTask = allTasks.find((task) => task.id === overIdString);
  return targetTask ? targetTask.status : null;
};
