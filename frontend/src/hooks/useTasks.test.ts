import { act, renderHook, waitFor } from "@testing-library/react";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { taskService } from "../services/taskService";
import { buildTask } from "../test/factories";
import { useTasks } from "./useTasks";

vi.mock("../services/taskService", () => ({
  taskService: {
    getTasks: vi.fn(),
    getTaskById: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    updateTaskStatus: vi.fn(),
    deleteTask: vi.fn()
  }
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() }
}));

const service = vi.mocked(taskService);

const renderLoadedHook = async () => {
  const hook = renderHook(() => useTasks());
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
};

describe("useTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carrega as tarefas ordenadas por prioridade", async () => {
    const low = buildTask({ priority: "LOW" });
    const urgent = buildTask({ priority: "URGENT" });
    service.getTasks.mockResolvedValue([low, urgent]);

    const { result } = await renderLoadedHook();

    expect(result.current.errorMessage).toBeNull();
    expect(result.current.tasks).toEqual([urgent, low]);
  });

  it("expõe o erro de carregamento e permite tentar novamente", async () => {
    service.getTasks.mockRejectedValueOnce(new Error("offline"));
    const { result } = await renderLoadedHook();

    expect(result.current.errorMessage).toBeTruthy();

    const task = buildTask();
    service.getTasks.mockResolvedValueOnce([task]);
    act(() => result.current.loadTasks());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.tasks).toEqual([task]);
  });

  it("filtra por texto e prioridade", async () => {
    const design = buildTask({ title: "Design", priority: "HIGH" });
    const deploy = buildTask({ title: "Deploy", priority: "LOW" });
    service.getTasks.mockResolvedValue([design, deploy]);
    const { result } = await renderLoadedHook();

    act(() => result.current.setSearchTerm("dep"));
    expect(result.current.filteredTasks).toEqual([deploy]);

    act(() => result.current.setSelectedPriority("HIGH"));
    expect(result.current.filteredTasks).toEqual([]);
  });

  it("cria uma tarefa e exibe feedback", async () => {
    service.getTasks.mockResolvedValue([]);
    const created = buildTask({ title: "Nova" });
    service.createTask.mockResolvedValue(created);
    const { result } = await renderLoadedHook();

    await act(() => result.current.createTask({ title: "Nova", priority: "MEDIUM" }));

    expect(result.current.tasks).toEqual([created]);
    expect(toast.success).toHaveBeenCalled();
  });

  it("propaga a falha ao criar (para o modal continuar aberto) e exibe a mensagem", async () => {
    service.getTasks.mockResolvedValue([]);
    service.createTask.mockRejectedValue(new Error("falhou"));
    const { result } = await renderLoadedHook();

    await expect(result.current.createTask({ title: "Nova", priority: "LOW" })).rejects.toThrow("falhou");
    expect(toast.error).toHaveBeenCalled();
    expect(result.current.tasks).toEqual([]);
  });

  it("move o cartão de forma otimista ao trocar o status", async () => {
    const task = buildTask({ status: "TODO" });
    service.getTasks.mockResolvedValue([task]);
    let resolveRequest: (value: typeof task) => void = () => undefined;
    service.updateTaskStatus.mockReturnValue(new Promise((resolve) => (resolveRequest = resolve)));
    const { result } = await renderLoadedHook();

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.updateTaskStatus(task.id, "DONE");
    });

    // Moved before the API answered.
    expect(result.current.tasks[0].status).toBe("DONE");

    const serverTask = { ...task, status: "DONE" as const, updatedAt: "2026-03-01T00:00:00.000Z" };
    await act(async () => {
      resolveRequest(serverTask);
      await pending;
    });

    expect(result.current.tasks[0]).toEqual(serverTask);
  });

  it("desfaz a movimentação se a API falhar", async () => {
    const task = buildTask({ status: "IN_PROGRESS" });
    service.getTasks.mockResolvedValue([task]);
    service.updateTaskStatus.mockRejectedValue(new Error("falhou"));
    const { result } = await renderLoadedHook();

    await act(() => result.current.updateTaskStatus(task.id, "REVIEW"));

    expect(result.current.tasks[0].status).toBe("IN_PROGRESS");
    expect(toast.error).toHaveBeenCalled();
  });

  it("atualiza e exclui tarefas", async () => {
    const task = buildTask({ title: "Antigo" });
    service.getTasks.mockResolvedValue([task]);
    service.updateTask.mockResolvedValue({ ...task, title: "Novo" });
    service.deleteTask.mockResolvedValue();
    const { result } = await renderLoadedHook();

    await act(() => result.current.updateTask(task.id, { title: "Novo" }));
    expect(result.current.tasks[0].title).toBe("Novo");

    await act(() => result.current.deleteTask(task.id));
    expect(result.current.tasks).toEqual([]);
    expect(service.deleteTask).toHaveBeenCalledWith(task.id);
  });
});
