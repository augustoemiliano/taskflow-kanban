import { resolve } from "node:path";
import type { Env } from "../config/env";
import { InMemoryTaskRepository } from "./inMemoryTaskRepository";
import { SqliteTaskRepository } from "./sqliteTaskRepository";
import type { TaskRepository } from "./taskRepository";

export interface RepositoryHandle {
  repository: TaskRepository;
  close: () => void;
}

/**
 * Chooses the persistence implementation. Services only depend on the
 * `TaskRepository` interface, so swapping storage needs no other change.
 */
export const createTaskRepository = (config: Pick<Env, "DATABASE_DRIVER" | "DATABASE_PATH">): RepositoryHandle => {
  if (config.DATABASE_DRIVER === "memory") {
    return { repository: new InMemoryTaskRepository(), close: () => undefined };
  }

  const databasePath = config.DATABASE_PATH === ":memory:" ? ":memory:" : resolve(config.DATABASE_PATH);
  const repository = new SqliteTaskRepository(databasePath);
  return { repository, close: () => repository.close() };
};
