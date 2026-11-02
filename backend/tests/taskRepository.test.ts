import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Task } from "../src/models/task";
import { InMemoryTaskRepository } from "../src/repositories/inMemoryTaskRepository";
import { SqliteTaskRepository } from "../src/repositories/sqliteTaskRepository";
import type { TaskRepository } from "../src/repositories/taskRepository";

const buildTask = (overrides: Partial<Task> = {}): Task => ({
  id: crypto.randomUUID(),
  title: "Tarefa",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:00:00.000Z",
  ...overrides
});

/**
 * Contract tests: every TaskRepository implementation must behave the same way.
 */
const implementations: Array<[string, () => TaskRepository]> = [
  ["InMemoryTaskRepository", () => new InMemoryTaskRepository()],
  ["SqliteTaskRepository (:memory:)", () => new SqliteTaskRepository(":memory:")]
];

describe.each(implementations)("%s", (_name, factory) => {
  let repository: TaskRepository;

  beforeEach(() => {
    repository = factory();
  });

  it("cria e busca por ID", async () => {
    const task = buildTask({ title: "Primeira" });
    await repository.create(task);

    expect(await repository.findById(task.id)).toEqual(task);
  });

  it("retorna null para ID inexistente", async () => {
    expect(await repository.findById(crypto.randomUUID())).toBeNull();
  });

  it("lista ordenando pela atualização mais recente", async () => {
    const older = buildTask({ title: "Antiga", updatedAt: "2026-01-01T10:00:00.000Z" });
    const newer = buildTask({ title: "Nova", updatedAt: "2026-01-02T10:00:00.000Z" });
    await repository.create(older);
    await repository.create(newer);

    const tasks = await repository.findAll();
    expect(tasks.map((task) => task.title)).toEqual(["Nova", "Antiga"]);
  });

  it("atualiza preservando createdAt", async () => {
    const task = buildTask();
    await repository.create(task);
    await repository.update({ ...task, title: "Editada", status: "DONE", updatedAt: "2026-02-01T00:00:00.000Z" });

    expect(await repository.findById(task.id)).toMatchObject({
      title: "Editada",
      status: "DONE",
      createdAt: task.createdAt,
      updatedAt: "2026-02-01T00:00:00.000Z"
    });
  });

  it("exclui", async () => {
    const task = buildTask();
    await repository.create(task);
    await repository.delete(task.id);

    expect(await repository.findById(task.id)).toBeNull();
    expect(await repository.findAll()).toHaveLength(0);
  });
});

describe("SqliteTaskRepository em arquivo", () => {
  const directory = mkdtempSync(join(tmpdir(), "taskflow-test-"));

  afterAll(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it("persiste os dados entre reinicializações e cria o diretório se necessário", async () => {
    const databasePath = join(directory, "nested", "taskflow.db");
    const task = buildTask({ title: "Persistente" });

    const firstConnection = new SqliteTaskRepository(databasePath);
    await firstConnection.create(task);
    firstConnection.close();

    const secondConnection = new SqliteTaskRepository(databasePath);
    expect(await secondConnection.findById(task.id)).toEqual(task);
    secondConnection.close();
  });

  it("garante integridade com CHECK constraints no banco", async () => {
    const repository = new SqliteTaskRepository(":memory:");

    await expect(
      repository.create(buildTask({ status: "ARCHIVED" as Task["status"] }))
    ).rejects.toThrow(/CHECK constraint failed/);

    repository.close();
  });
});
