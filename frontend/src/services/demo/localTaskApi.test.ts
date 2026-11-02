import { beforeEach, describe, expect, it } from "vitest";
import { getApiErrorMessage } from "../../utils/apiError";
import { TaskApiError } from "../../utils/taskApiError";
import { createBrowserStorage, createMemoryStorage, type KeyValueStorage } from "./browserStorage";
import { createLocalTaskApi, DEMO_STORAGE_KEY, type LocalTaskApiOptions } from "./localTaskApi";
import { buildSeedTasks } from "./seedTasks";

const UNKNOWN_ID = "00000000-0000-4000-8000-999999999999";

const createClock = (start = "2026-05-01T12:00:00.000Z") => {
  let current = new Date(start).getTime();
  return {
    now: () => new Date(current),
    advance: (ms = 1000) => {
      current += ms;
    }
  };
};

const createIdGenerator = () => {
  let sequence = 0;
  return () => {
    sequence += 1;
    return `aaaaaaaa-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
  };
};

const expectApiError = async (promise: Promise<unknown>, statusCode: number, code: string) => {
  const error = await promise.then(
    () => null,
    (reason: unknown) => reason
  );
  expect(error).toBeInstanceOf(TaskApiError);
  expect(error).toMatchObject({ statusCode, code });
  return error as TaskApiError;
};

describe("createLocalTaskApi (modo demo)", () => {
  let storage: KeyValueStorage;
  let clock: ReturnType<typeof createClock>;
  let options: LocalTaskApiOptions;

  beforeEach(() => {
    storage = createMemoryStorage();
    clock = createClock();
    options = { storage, now: clock.now, generateId: createIdGenerator() };
  });

  describe("seed inicial", () => {
    it("popula as tarefas de exemplo no primeiro acesso, distribuídas nas quatro colunas", async () => {
      const api = createLocalTaskApi(options);

      const tasks = await api.getTasks();

      expect(tasks).toHaveLength(buildSeedTasks().length);
      expect(new Set(tasks.map((task) => task.status))).toEqual(new Set(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]));
      expect(storage.getItem(DEMO_STORAGE_KEY)).not.toBeNull();
    });

    it("retorna as tarefas da mais recentemente atualizada para a mais antiga", async () => {
      const tasks = await createLocalTaskApi(options).getTasks();
      const updatedAt = tasks.map((task) => task.updatedAt);

      expect(updatedAt).toEqual([...updatedAt].sort().reverse());
    });

    it("não recria o seed quando o usuário excluiu todas as tarefas", async () => {
      const api = createLocalTaskApi(options);
      for (const task of await api.getTasks()) {
        await api.deleteTask(task.id);
      }

      expect(await api.getTasks()).toEqual([]);
    });

    it("volta ao seed se o conteúdo salvo estiver corrompido", async () => {
      storage.setItem(DEMO_STORAGE_KEY, "{isso não é json");

      expect(await createLocalTaskApi(options).getTasks()).toHaveLength(buildSeedTasks().length);
    });
  });

  describe("CRUD", () => {
    it("cria uma tarefa em TODO com título/descrição normalizados e timestamps", async () => {
      const api = createLocalTaskApi({ ...options, seed: () => [] });

      const created = await api.createTask({ title: "  Nova tarefa  ", description: "  detalhe ", priority: "HIGH" });

      expect(created).toEqual({
        id: "aaaaaaaa-0000-4000-8000-000000000001",
        title: "Nova tarefa",
        description: "detalhe",
        status: "TODO",
        priority: "HIGH",
        createdAt: "2026-05-01T12:00:00.000Z",
        updatedAt: "2026-05-01T12:00:00.000Z"
      });
      expect(await api.getTasks()).toEqual([created]);
      expect(await api.getTaskById(created.id)).toEqual(created);
    });

    it("usa descrição vazia quando ela não é informada", async () => {
      const api = createLocalTaskApi({ ...options, seed: () => [] });

      const created = await api.createTask({ title: "Sem descrição", priority: "LOW" });

      expect(created.description).toBe("");
    });

    it("atualiza campos parcialmente, preservando os demais e renovando updatedAt", async () => {
      const api = createLocalTaskApi({ ...options, seed: () => [] });
      const created = await api.createTask({ title: "Original", description: "Mantida", priority: "LOW" });
      clock.advance(60_000);

      const updated = await api.updateTask(created.id, { title: "Editada", priority: "URGENT" });

      expect(updated).toMatchObject({ title: "Editada", description: "Mantida", priority: "URGENT", status: "TODO" });
      expect(updated.createdAt).toBe(created.createdAt);
      expect(updated.updatedAt).toBe("2026-05-01T12:01:00.000Z");
      expect(await api.getTaskById(created.id)).toEqual(updated);
    });

    it("exclui uma tarefa", async () => {
      const api = createLocalTaskApi(options);
      const [first, ...rest] = await api.getTasks();

      await api.deleteTask(first.id);

      expect(await api.getTasks()).toEqual(rest);
      await expectApiError(api.getTaskById(first.id), 404, "TASK_NOT_FOUND");
    });

    it("devolve cópias, sem permitir alterar o estado salvo por referência", async () => {
      const api = createLocalTaskApi(options);
      const [task] = await api.getTasks();

      task.title = "Alterado por fora";

      expect((await api.getTaskById(task.id)).title).not.toBe("Alterado por fora");
    });
  });

  describe("mover entre colunas", () => {
    it("altera o status e o updatedAt da tarefa", async () => {
      const api = createLocalTaskApi(options);
      const todo = (await api.getTasks()).find((task) => task.status === "TODO")!;
      clock.advance(5_000);

      const moved = await api.updateTaskStatus(todo.id, "REVIEW");

      expect(moved).toEqual({ ...todo, status: "REVIEW", updatedAt: "2026-05-01T12:00:05.000Z" });
      expect((await api.getTasks())[0]).toEqual(moved);
    });

    it("rejeita status inválido com erro de validação", async () => {
      const api = createLocalTaskApi(options);
      const [task] = await api.getTasks();

      const error = await expectApiError(
        api.updateTaskStatus(task.id, "ARCHIVED" as never),
        400,
        "VALIDATION_ERROR"
      );
      expect(error.details).toEqual([
        { field: "status", message: "O status deve ser TODO, IN_PROGRESS, REVIEW ou DONE." }
      ]);
    });
  });

  describe("validações equivalentes às da API", () => {
    it("rejeita título curto, descrição longa e prioridade inválida ao criar", async () => {
      const api = createLocalTaskApi({ ...options, seed: () => [] });

      const error = await expectApiError(
        api.createTask({ title: " a ", description: "x".repeat(501), priority: "MAX" as never }),
        400,
        "VALIDATION_ERROR"
      );

      expect(error.message).toBe("Existem campos inválidos na requisição.");
      expect(error.details.map((detail) => detail.field)).toEqual(["title", "description", "priority"]);
      expect(await api.getTasks()).toEqual([]);
    });

    it("exige título ao criar e ao menos um campo ao atualizar", async () => {
      const api = createLocalTaskApi(options);
      const [task] = await api.getTasks();

      const createError = await expectApiError(
        api.createTask({ priority: "LOW" } as never),
        400,
        "VALIDATION_ERROR"
      );
      expect(createError.details).toContainEqual({ field: "title", message: "O título é obrigatório." });

      const updateError = await expectApiError(api.updateTask(task.id, {}), 400, "VALIDATION_ERROR");
      expect(updateError.details[0].message).toBe("Informe ao menos um campo para atualização.");
    });

    it("responde 400 para ID inválido e 404 para tarefa inexistente", async () => {
      const api = createLocalTaskApi(options);

      await expectApiError(api.getTaskById("abc"), 400, "VALIDATION_ERROR");
      await expectApiError(api.updateTask(UNKNOWN_ID, { title: "Qualquer" }), 404, "TASK_NOT_FOUND");
      await expectApiError(api.updateTaskStatus(UNKNOWN_ID, "DONE"), 404, "TASK_NOT_FOUND");
      await expectApiError(api.deleteTask(UNKNOWN_ID), 404, "TASK_NOT_FOUND");
    });

    it("expõe a mensagem do erro para os toasts da interface", async () => {
      const api = createLocalTaskApi(options);
      const error = await expectApiError(api.getTaskById(UNKNOWN_ID), 404, "TASK_NOT_FOUND");

      expect(getApiErrorMessage(error)).toBe("Tarefa não encontrada.");
    });
  });

  describe("persistência", () => {
    it("mantém os dados entre instâncias que usam o mesmo armazenamento (recarregar a página)", async () => {
      const firstSession = createLocalTaskApi(options);
      const created = await firstSession.createTask({ title: "Persistida", priority: "MEDIUM" });
      await firstSession.updateTaskStatus(created.id, "DONE");

      const secondSession = createLocalTaskApi({ storage, now: clock.now });

      expect(await secondSession.getTaskById(created.id)).toMatchObject({ title: "Persistida", status: "DONE" });
    });

    it("grava no localStorage do navegador", async () => {
      window.localStorage.clear();
      const api = createLocalTaskApi({ ...options, storage: createBrowserStorage() });

      const created = await api.createTask({ title: "No navegador", priority: "LOW" });

      const saved = JSON.parse(window.localStorage.getItem(DEMO_STORAGE_KEY) ?? "[]") as Array<{ id: string }>;
      expect(saved.map((task) => task.id)).toContain(created.id);
      window.localStorage.clear();
    });

    it("continua funcionando em memória quando o localStorage falha", async () => {
      const brokenStorage = createBrowserStorage(() => {
        throw new Error("SecurityError: acesso ao storage bloqueado");
      });
      const api = createLocalTaskApi({ ...options, storage: brokenStorage });

      const created = await api.createTask({ title: "Só em memória", priority: "HIGH" });
      await api.updateTaskStatus(created.id, "IN_PROGRESS");

      expect(await api.getTaskById(created.id)).toMatchObject({ status: "IN_PROGRESS" });
    });

    it("mantém a última versão em memória quando a gravação no localStorage falha (cota cheia)", async () => {
      const backing = createMemoryStorage();
      let quotaExceeded = false;
      const flakyStorage: KeyValueStorage = {
        ...backing,
        setItem: (key, value) => {
          if (quotaExceeded) {
            throw new Error("QuotaExceededError");
          }
          backing.setItem(key, value);
        }
      };
      const api = createLocalTaskApi({ ...options, storage: createBrowserStorage(() => flakyStorage) });
      await api.getTasks();
      quotaExceeded = true;

      const created = await api.createTask({ title: "Depois da cota", priority: "LOW" });

      expect(await api.getTaskById(created.id)).toEqual(created);
    });
  });

  describe("reset", () => {
    it("restaura exatamente as tarefas de exemplo, descartando as alterações", async () => {
      const api = createLocalTaskApi(options);
      const seeded = await api.getTasks();
      await api.createTask({ title: "Criada pelo usuário", priority: "LOW" });
      await api.deleteTask(seeded[0].id);
      await api.updateTaskStatus(seeded[1].id, "DONE");

      await api.reset();

      expect(await api.getTasks()).toEqual(seeded);
    });

    it("também funciona depois de o quadro ter sido esvaziado e persiste o seed", async () => {
      const api = createLocalTaskApi(options);
      for (const task of await api.getTasks()) {
        await api.deleteTask(task.id);
      }

      await api.reset();

      expect(await createLocalTaskApi({ storage, now: clock.now }).getTasks()).toHaveLength(
        buildSeedTasks().length
      );
    });
  });
});
