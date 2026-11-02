import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { taskService } from "../services/taskService";
import { buildTask } from "../test/factories";
import { DashboardPage } from "./DashboardPage";

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

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra o estado vazio com atalho para criar a primeira tarefa", async () => {
    service.getTasks.mockResolvedValue([]);
    render(<DashboardPage />);

    expect(await screen.findByText("Nenhuma tarefa ainda")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar primeira tarefa/i })).toBeInTheDocument();
  });

  it("mostra erro de carregamento com opção de tentar novamente", async () => {
    service.getTasks.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(<DashboardPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao carregar tarefas");

    await user.click(screen.getByRole("button", { name: /tentar novamente/i }));

    expect(await screen.findByText("Nenhuma tarefa ainda")).toBeInTheDocument();
    expect(service.getTasks).toHaveBeenCalledTimes(2);
  });

  it("renderiza os cartões na coluna correta", async () => {
    service.getTasks.mockResolvedValue([
      buildTask({ title: "Escrever testes", status: "IN_PROGRESS" }),
      buildTask({ title: "Publicar", status: "DONE" })
    ]);
    render(<DashboardPage />);

    const inProgress = await screen.findByTestId("column-IN_PROGRESS");
    expect(within(inProgress).getByText("Escrever testes")).toBeInTheDocument();
    expect(within(screen.getByTestId("column-DONE")).getByText("Publicar")).toBeInTheDocument();
    expect(within(screen.getByTestId("column-TODO")).getByText("Sem tarefas")).toBeInTheDocument();
  });

  it("valida o formulário e cria uma tarefa", async () => {
    service.getTasks.mockResolvedValue([]);
    service.createTask.mockImplementation(async (payload) =>
      buildTask({ title: payload.title, priority: payload.priority })
    );
    const user = userEvent.setup();
    render(<DashboardPage />);

    await user.click(await screen.findByRole("button", { name: /nova tarefa/i }));
    const dialog = screen.getByRole("dialog", { name: "Nova tarefa" });

    await user.type(within(dialog).getByLabelText("Título"), "ab");
    await user.click(within(dialog).getByRole("button", { name: "Criar tarefa" }));
    expect(within(dialog).getByText(/entre 3 e 100 caracteres/)).toBeInTheDocument();
    expect(service.createTask).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText("Título"), "c ok  ");
    await user.selectOptions(within(dialog).getByLabelText("Prioridade"), "URGENT");
    await user.click(within(dialog).getByRole("button", { name: "Criar tarefa" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(service.createTask).toHaveBeenCalledWith({ title: "abc ok", description: "", priority: "URGENT" });
    expect(within(screen.getByTestId("column-TODO")).getByText("abc ok")).toBeInTheDocument();
  });

  it("mantém o modal aberto quando a API recusa", async () => {
    service.getTasks.mockResolvedValue([]);
    service.createTask.mockRejectedValue(new Error("falhou"));
    const user = userEvent.setup();
    render(<DashboardPage />);

    await user.click(await screen.findByRole("button", { name: /nova tarefa/i }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Título"), "Tarefa válida");
    await user.click(within(dialog).getByRole("button", { name: "Criar tarefa" }));

    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Criar tarefa" })).toBeEnabled());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Título")).toHaveValue("Tarefa válida");
  });

  it("edita uma tarefa existente com o formulário preenchido", async () => {
    const task = buildTask({ title: "Título antigo", description: "Desc" });
    service.getTasks.mockResolvedValue([task]);
    service.updateTask.mockImplementation(async (_id, payload) => ({ ...task, ...payload }));
    const user = userEvent.setup();
    render(<DashboardPage />);

    await user.click(await screen.findByRole("button", { name: "Editar tarefa Título antigo" }));
    const dialog = screen.getByRole("dialog", { name: "Editar tarefa" });
    const titleInput = within(dialog).getByLabelText("Título");
    expect(titleInput).toHaveValue("Título antigo");

    await user.clear(titleInput);
    await user.type(titleInput, "Título novo");
    await user.click(within(dialog).getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(service.updateTask).toHaveBeenCalledWith(task.id, {
      title: "Título novo",
      description: "Desc",
      priority: task.priority
    });
    expect(screen.getByText("Título novo")).toBeInTheDocument();
  });

  it("pede confirmação antes de excluir e permite cancelar com Esc", async () => {
    const task = buildTask({ title: "Remover isto" });
    service.getTasks.mockResolvedValue([task]);
    service.deleteTask.mockResolvedValue();
    const user = userEvent.setup();
    render(<DashboardPage />);

    await user.click(await screen.findByRole("button", { name: "Excluir tarefa Remover isto" }));
    expect(screen.getByRole("dialog", { name: "Excluir tarefa" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(service.deleteTask).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Excluir tarefa Remover isto" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(screen.queryByText("Remover isto")).not.toBeInTheDocument());
    expect(service.deleteTask).toHaveBeenCalledWith(task.id);
    expect(screen.getByText("Nenhuma tarefa ainda")).toBeInTheDocument();
  });

  it("filtra por busca e oferece limpar filtros", async () => {
    service.getTasks.mockResolvedValue([buildTask({ title: "Design" }), buildTask({ title: "Deploy" })]);
    const user = userEvent.setup();
    render(<DashboardPage />);

    await user.type(await screen.findByLabelText("Buscar tarefas"), "xyz");
    expect(screen.getByText("Nenhuma tarefa encontrada com os filtros atuais")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("Deploy")).toBeInTheDocument();
  });
});
