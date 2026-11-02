import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { InMemoryTaskRepository } from "../src/repositories/inMemoryTaskRepository";

const FRONTEND_ORIGIN = "http://localhost:5173";

const buildApp = () =>
  createApp({ taskRepository: new InMemoryTaskRepository(), allowedOrigins: [FRONTEND_ORIGIN] });

describe("API /api/tasks", () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  const createTask = (body: Record<string, unknown> = {}) =>
    request(app)
      .post("/api/tasks")
      .send({ title: "Criar layout", description: "Kanban", priority: "HIGH", ...body });

  it("responde ao health check", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { status: "ok" } });
  });

  it("lista vazia inicialmente", async () => {
    const response = await request(app).get("/api/tasks");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: [] });
  });

  it("cria uma tarefa com status TODO e campos normalizados", async () => {
    const response = await createTask({ title: "  Criar layout  " });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      title: "Criar layout",
      description: "Kanban",
      priority: "HIGH",
      status: "TODO"
    });
    expect(response.body.data.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.body.data.createdAt).toBe(response.body.data.updatedAt);
  });

  it("ignora campos desconhecidos e não permite definir status na criação", async () => {
    const response = await createTask({ status: "DONE", id: "hack", extra: true });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe("TODO");
    expect(response.body.data.id).not.toBe("hack");
    expect(response.body.data).not.toHaveProperty("extra");
  });

  it("busca uma tarefa por ID", async () => {
    const created = await createTask();
    const response = await request(app).get(`/api/tasks/${created.body.data.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(created.body.data);
  });

  it("atualiza campos parcialmente e preserva os demais", async () => {
    const created = await createTask();
    const response = await request(app)
      .patch(`/api/tasks/${created.body.data.id}`)
      .send({ title: "Título novo", priority: "LOW" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      title: "Título novo",
      priority: "LOW",
      description: "Kanban",
      status: "TODO",
      createdAt: created.body.data.createdAt
    });
  });

  it("permite limpar a descrição", async () => {
    const created = await createTask();
    const response = await request(app).patch(`/api/tasks/${created.body.data.id}`).send({ description: "" });

    expect(response.status).toBe(200);
    expect(response.body.data.description).toBe("");
  });

  it("altera apenas o status pelo endpoint dedicado", async () => {
    const created = await createTask();
    const response = await request(app)
      .patch(`/api/tasks/${created.body.data.id}/status`)
      .send({ status: "IN_PROGRESS" });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("IN_PROGRESS");
    expect(response.body.data.title).toBe("Criar layout");
  });

  it("exclui uma tarefa", async () => {
    const created = await createTask();
    const id = created.body.data.id;

    const deleteResponse = await request(app).delete(`/api/tasks/${id}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ success: true, data: null });

    const getResponse = await request(app).get(`/api/tasks/${id}`);
    expect(getResponse.status).toBe(404);
    expect(getResponse.body.error.code).toBe("TASK_NOT_FOUND");
  });

  describe("validação e erros", () => {
    it("rejeita criação sem título e com prioridade inválida", async () => {
      const response = await request(app).post("/api/tasks").send({ priority: "SUPER" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      const fields = response.body.error.details.map((detail: { field: string }) => detail.field);
      expect(fields).toEqual(expect.arrayContaining(["title", "priority"]));
    });

    it("rejeita título curto demais (após trim) e descrição longa demais", async () => {
      const response = await createTask({ title: "  ab ", description: "x".repeat(501) });

      expect(response.status).toBe(400);
      const fields = response.body.error.details.map((detail: { field: string }) => detail.field);
      expect(fields).toEqual(expect.arrayContaining(["title", "description"]));
    });

    it("rejeita atualização vazia", async () => {
      const created = await createTask();
      const response = await request(app).patch(`/api/tasks/${created.body.data.id}`).send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejeita status inválido", async () => {
      const created = await createTask();
      const response = await request(app)
        .patch(`/api/tasks/${created.body.data.id}/status`)
        .send({ status: "ARCHIVED" });

      expect(response.status).toBe(400);
      expect(response.body.error.details[0].field).toBe("status");
    });

    it("rejeita ID que não é UUID", async () => {
      const response = await request(app).get("/api/tasks/abc");

      expect(response.status).toBe(400);
      expect(response.body.error.details[0]).toMatchObject({ field: "id" });
    });

    it("retorna 404 para tarefa inexistente em leitura, edição e exclusão", async () => {
      const missingId = "6f1f2c1e-5b1a-4a7e-9f62-3b0f8f3d9c11";

      const responses = await Promise.all([
        request(app).get(`/api/tasks/${missingId}`),
        request(app).patch(`/api/tasks/${missingId}`).send({ title: "Qualquer" }),
        request(app).patch(`/api/tasks/${missingId}/status`).send({ status: "DONE" }),
        request(app).delete(`/api/tasks/${missingId}`)
      ]);

      for (const response of responses) {
        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("TASK_NOT_FOUND");
      }
    });

    it("retorna 400 (não 500) para JSON malformado", async () => {
      const response = await request(app)
        .post("/api/tasks")
        .set("Content-Type", "application/json")
        .send('{"title": "sem fechar"');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("INVALID_JSON");
    });

    it("retorna 404 padronizado para rota inexistente", async () => {
      const response = await request(app).get("/api/nao-existe");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: { code: "RESOURCE_NOT_FOUND", message: "Rota não encontrada.", details: [] }
      });
    });
  });

  describe("CORS", () => {
    it("libera a origem configurada", async () => {
      const response = await request(app).get("/api/tasks").set("Origin", FRONTEND_ORIGIN);

      expect(response.headers["access-control-allow-origin"]).toBe(FRONTEND_ORIGIN);
    });

    it("não libera origens desconhecidas", async () => {
      const response = await request(app).get("/api/tasks").set("Origin", "http://malicioso.example");

      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });
  });
});
