import { describe, expect, it } from "vitest";
import { buildTask } from "../test/factories";
import {
  countTasksByStatus,
  groupTasksByStatus,
  isTaskStatus,
  matchesTaskFilters,
  resolveDropTargetStatus,
  sortTasksByPriorityAndDate
} from "./taskUtils";

describe("matchesTaskFilters", () => {
  const task = buildTask({ title: "Criar Layout", description: "Tela do Kanban", priority: "HIGH" });

  it("aceita tudo sem filtros", () => {
    expect(matchesTaskFilters(task, "", "ALL")).toBe(true);
    expect(matchesTaskFilters(task, "   ", "ALL")).toBe(true);
  });

  it("busca no título e na descrição sem diferenciar maiúsculas", () => {
    expect(matchesTaskFilters(task, "layout", "ALL")).toBe(true);
    expect(matchesTaskFilters(task, "KANBAN", "ALL")).toBe(true);
    expect(matchesTaskFilters(task, "  tela  ", "ALL")).toBe(true);
    expect(matchesTaskFilters(task, "inexistente", "ALL")).toBe(false);
  });

  it("filtra por prioridade combinada com o texto", () => {
    expect(matchesTaskFilters(task, "", "HIGH")).toBe(true);
    expect(matchesTaskFilters(task, "", "LOW")).toBe(false);
    expect(matchesTaskFilters(task, "layout", "LOW")).toBe(false);
  });
});

describe("sortTasksByPriorityAndDate", () => {
  it("ordena por prioridade e depois pela atualização mais recente, sem mutar a entrada", () => {
    const low = buildTask({ title: "low", priority: "LOW" });
    const urgent = buildTask({ title: "urgent", priority: "URGENT" });
    const highOld = buildTask({ title: "high-old", priority: "HIGH", updatedAt: "2026-01-01T00:00:00.000Z" });
    const highNew = buildTask({ title: "high-new", priority: "HIGH", updatedAt: "2026-02-01T00:00:00.000Z" });
    const input = [low, highOld, urgent, highNew];

    const sorted = sortTasksByPriorityAndDate(input);

    expect(sorted.map((task) => task.title)).toEqual(["urgent", "high-new", "high-old", "low"]);
    expect(input[0]).toBe(low);
  });
});

describe("countTasksByStatus / groupTasksByStatus", () => {
  const tasks = [
    buildTask({ status: "TODO" }),
    buildTask({ status: "TODO" }),
    buildTask({ status: "DONE" })
  ];

  it("conta tarefas por status incluindo colunas vazias", () => {
    expect(countTasksByStatus(tasks)).toEqual({ TODO: 2, IN_PROGRESS: 0, REVIEW: 0, DONE: 1 });
    expect(countTasksByStatus([])).toEqual({ TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 });
  });

  it("agrupa preservando a ordem", () => {
    const grouped = groupTasksByStatus(tasks);
    expect(grouped.TODO).toEqual([tasks[0], tasks[1]]);
    expect(grouped.DONE).toEqual([tasks[2]]);
    expect(grouped.REVIEW).toEqual([]);
  });
});

describe("resolveDropTargetStatus", () => {
  const reviewTask = buildTask({ status: "REVIEW" });

  it("usa o ID da coluna quando solta sobre a coluna", () => {
    expect(resolveDropTargetStatus("IN_PROGRESS", [reviewTask])).toBe("IN_PROGRESS");
  });

  it("usa o status do cartão quando solta sobre outro cartão", () => {
    expect(resolveDropTargetStatus(reviewTask.id, [reviewTask])).toBe("REVIEW");
  });

  it("retorna null para alvos desconhecidos", () => {
    expect(resolveDropTargetStatus("qualquer-coisa", [reviewTask])).toBeNull();
    expect(resolveDropTargetStatus(42, [reviewTask])).toBeNull();
  });
});

describe("isTaskStatus", () => {
  it("valida apenas status conhecidos", () => {
    expect(isTaskStatus("DONE")).toBe(true);
    expect(isTaskStatus("done")).toBe(false);
    expect(isTaskStatus(undefined)).toBe(false);
  });
});
