import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync, type StatementSync } from "node:sqlite";
import { TASK_PRIORITIES, TASK_STATUSES, type Task } from "../models/task";
import type { TaskRepository } from "./taskRepository";

interface TaskRow {
  id: string;
  title: string;
  description: string;
  status: Task["status"];
  priority: Task["priority"];
  created_at: string;
  updated_at: string;
}

const toSqlList = (values: readonly string[]): string => values.map((value) => `'${value}'`).join(", ");

/**
 * Ordered list of schema migrations. The index + 1 is stored in `PRAGMA user_version`,
 * so new migrations are applied incrementally on startup — append, never edit.
 */
const MIGRATIONS: string[] = [
  `CREATE TABLE tasks (
     id          TEXT PRIMARY KEY,
     title       TEXT NOT NULL,
     description TEXT NOT NULL DEFAULT '',
     status      TEXT NOT NULL CHECK (status IN (${toSqlList(TASK_STATUSES)})),
     priority    TEXT NOT NULL CHECK (priority IN (${toSqlList(TASK_PRIORITIES)})),
     created_at  TEXT NOT NULL,
     updated_at  TEXT NOT NULL
   );
   CREATE INDEX idx_tasks_updated_at ON tasks (updated_at DESC);`
];

const mapRowToTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  description: row.description,
  status: row.status,
  priority: row.priority,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

/**
 * TaskRepository backed by SQLite through Node's built-in `node:sqlite` module
 * (no native dependency to compile). Pass `":memory:"` for an ephemeral database.
 */
export class SqliteTaskRepository implements TaskRepository {
  private readonly database: DatabaseSync;
  private readonly statements: {
    findAll: StatementSync;
    findById: StatementSync;
    insert: StatementSync;
    update: StatementSync;
    delete: StatementSync;
  };

  constructor(databasePath: string) {
    if (databasePath !== ":memory:") {
      mkdirSync(dirname(databasePath), { recursive: true });
    }

    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    this.migrate();

    this.statements = {
      findAll: this.database.prepare("SELECT * FROM tasks ORDER BY updated_at DESC"),
      findById: this.database.prepare("SELECT * FROM tasks WHERE id = ?"),
      insert: this.database.prepare(
        `INSERT INTO tasks (id, title, description, status, priority, created_at, updated_at)
         VALUES (:id, :title, :description, :status, :priority, :createdAt, :updatedAt)`
      ),
      update: this.database.prepare(
        `UPDATE tasks
            SET title = :title, description = :description, status = :status,
                priority = :priority, updated_at = :updatedAt
          WHERE id = :id`
      ),
      delete: this.database.prepare("DELETE FROM tasks WHERE id = ?")
    };
  }

  private migrate(): void {
    const { user_version: currentVersion } = this.database.prepare("PRAGMA user_version").get() as {
      user_version: number;
    };

    for (let index = currentVersion; index < MIGRATIONS.length; index += 1) {
      this.database.exec("BEGIN");
      try {
        this.database.exec(MIGRATIONS[index]);
        this.database.exec(`PRAGMA user_version = ${index + 1}`);
        this.database.exec("COMMIT");
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
    }
  }

  private toParams(task: Task) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };
  }

  async findAll(): Promise<Task[]> {
    const rows = this.statements.findAll.all() as unknown as TaskRow[];
    return rows.map(mapRowToTask);
  }

  async findById(taskId: string): Promise<Task | null> {
    const row = this.statements.findById.get(taskId) as unknown as TaskRow | undefined;
    return row ? mapRowToTask(row) : null;
  }

  async create(task: Task): Promise<Task> {
    this.statements.insert.run(this.toParams(task));
    return task;
  }

  async update(task: Task): Promise<Task> {
    const { createdAt: _createdAt, ...params } = this.toParams(task);
    this.statements.update.run(params);
    return task;
  }

  async delete(taskId: string): Promise<void> {
    this.statements.delete.run(taskId);
  }

  close(): void {
    if (this.database.isOpen) {
      this.database.close();
    }
  }
}
