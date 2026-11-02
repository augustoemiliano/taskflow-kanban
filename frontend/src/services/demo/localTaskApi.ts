import { TASK_PRIORITIES, TASK_STATUSES, type Task } from "../../types/task";
import { TaskApiError } from "../../utils/taskApiError";
import type { TaskApi } from "../taskApi";
import { createMemoryStorage, type KeyValueStorage } from "./browserStorage";
import { assertTaskId, parseCreateTaskPayload, parseTaskStatus, parseUpdateTaskPayload } from "./demoTaskValidation";
import { buildSeedTasks } from "./seedTasks";

export const DEMO_STORAGE_KEY = "taskflow-kanban:demo:tasks";

export interface LocalTaskApi extends TaskApi {
  /** Replaces whatever is stored with the sample tasks. */
  reset(): Promise<void>;
}

export interface LocalTaskApiOptions {
  storage?: KeyValueStorage;
  storageKey?: string;
  now?: () => Date;
  generateId?: () => string;
  seed?: (now: Date) => Task[];
}

const fallbackUuid = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

// `crypto.randomUUID` only exists in secure contexts (HTTPS/localhost).
const defaultGenerateId = (): string =>
  typeof crypto.randomUUID === "function" ? crypto.randomUUID() : fallbackUuid();

const isStoredTask = (value: unknown): value is Task => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const task = value as Record<string, unknown>;
  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.description === "string" &&
    typeof task.createdAt === "string" &&
    typeof task.updatedAt === "string" &&
    (TASK_STATUSES as readonly unknown[]).includes(task.status) &&
    (TASK_PRIORITIES as readonly unknown[]).includes(task.priority)
  );
};

const notFound = (): never => {
  throw new TaskApiError(404, "TASK_NOT_FOUND", "Tarefa não encontrada.");
};

/**
 * Browser-only implementation of the task API used by the demo build. It follows the
 * same contract as the Express API (validation, 404s, timestamps, ordering) and keeps
 * the data in the given storage (localStorage with in-memory fallback in the app).
 */
export const createLocalTaskApi = ({
  storage = createMemoryStorage(),
  storageKey = DEMO_STORAGE_KEY,
  now = () => new Date(),
  generateId = defaultGenerateId,
  seed = buildSeedTasks
}: LocalTaskApiOptions = {}): LocalTaskApi => {
  const save = (tasks: Task[]): void => {
    storage.setItem(storageKey, JSON.stringify(tasks));
  };

  const seedStorage = (): Task[] => {
    const tasks = seed(now());
    save(tasks);
    return tasks;
  };

  /** Reads the stored tasks; seeds on first use or when the stored value is unreadable. */
  const load = (): Task[] => {
    const raw = storage.getItem(storageKey);
    if (raw === null) {
      return seedStorage();
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isStoredTask) : seedStorage();
    } catch {
      return seedStorage();
    }
  };

  const findOrFail = (tasks: Task[], taskId: string): Task => tasks.find((task) => task.id === taskId) ?? notFound();

  const replace = (taskId: string, buildNext: (current: Task) => Task): Task => {
    const tasks = load();
    const updated = buildNext(findOrFail(tasks, taskId));
    save(tasks.map((task) => (task.id === taskId ? updated : task)));
    return { ...updated };
  };

  return {
    async getTasks() {
      // Same default ordering as the API repository: most recently updated first.
      return load().sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
    },

    async getTaskById(taskId) {
      return { ...findOrFail(load(), assertTaskId(taskId)) };
    },

    async createTask(payload) {
      const data = parseCreateTaskPayload(payload);
      const timestamp = now().toISOString();
      const task: Task = {
        id: generateId(),
        title: data.title,
        description: data.description ?? "",
        status: "TODO",
        priority: data.priority,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      save([...load(), task]);
      return { ...task };
    },

    async updateTask(taskId, payload) {
      const id = assertTaskId(taskId);
      const data = parseUpdateTaskPayload(payload);
      return replace(id, (current) => ({
        ...current,
        ...data,
        description: data.description ?? current.description,
        updatedAt: now().toISOString()
      }));
    },

    async updateTaskStatus(taskId, status) {
      const id = assertTaskId(taskId);
      const nextStatus = parseTaskStatus(status);
      return replace(id, (current) => ({ ...current, status: nextStatus, updatedAt: now().toISOString() }));
    },

    async deleteTask(taskId) {
      const id = assertTaskId(taskId);
      const tasks = load();
      findOrFail(tasks, id);
      save(tasks.filter((task) => task.id !== id));
    },

    async reset() {
      seedStorage();
    }
  };
};
