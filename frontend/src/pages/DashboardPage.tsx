import { ListFilter, Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { KanbanBoard } from "../components/kanban/KanbanBoard";
import { TaskModal } from "../components/kanban/TaskModal";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { PRIORITY_LABELS, STATUS_LABELS } from "../constants/task";
import { useTasks } from "../hooks/useTasks";
import { TASK_STATUSES, type Task, type TaskPriority } from "../types/task";
import { countTasksByStatus } from "../utils/taskUtils";

type TaskModalState = { mode: "create" } | { mode: "edit"; task: Task } | null;

const BoardSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-live="polite">
    <span className="sr-only">Carregando tarefas...</span>
    {TASK_STATUSES.map((status) => (
      <div key={status} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="space-y-3">
          {[0, 1].map((index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl bg-white shadow-sm" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const DashboardPage = () => {
  const {
    tasks,
    filteredTasks,
    isLoading,
    errorMessage,
    searchTerm,
    selectedPriority,
    setSearchTerm,
    setSelectedPriority,
    loadTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask
  } = useTasks();

  const [taskModal, setTaskModal] = useState<TaskModalState>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusCounters = useMemo(() => countTasksByStatus(tasks), [tasks]);
  const hasActiveFilters = searchTerm.trim().length > 0 || selectedPriority !== "ALL";
  const isReady = !isLoading && !errorMessage;

  const openCreateTaskModal = () => setTaskModal({ mode: "create" });
  const openEditTaskModal = (task: Task) => setTaskModal({ mode: "edit", task });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedPriority("ALL");
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTask(taskToDelete.id);
      setTaskToDelete(null);
    } catch {
      // Error toast already shown by useTasks; keep the dialog so the user can retry.
    } finally {
      setIsDeleting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <BoardSkeleton />;
    }

    if (errorMessage) {
      return (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-rose-700">Falha ao carregar tarefas</p>
          <p className="mt-1 text-sm text-rose-600">{errorMessage}</p>
          <Button className="mt-4 gap-2" onClick={loadTasks}>
            <RefreshCw size={16} aria-hidden="true" />
            Tentar novamente
          </Button>
        </div>
      );
    }

    if (tasks.length === 0) {
      return (
        <EmptyState
          title="Nenhuma tarefa ainda"
          description="Comece criando sua primeira tarefa para visualizar o quadro Kanban."
          action={
            <Button onClick={openCreateTaskModal} className="gap-2">
              <Plus size={16} aria-hidden="true" />
              Criar primeira tarefa
            </Button>
          }
        />
      );
    }

    if (filteredTasks.length === 0) {
      return (
        <EmptyState
          title="Nenhuma tarefa encontrada com os filtros atuais"
          description="Ajuste a busca ou o filtro de prioridade para ver mais resultados."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Limpar filtros
            </Button>
          }
        />
      );
    }

    return (
      <KanbanBoard
        tasks={filteredTasks}
        onTaskEdit={openEditTaskModal}
        onTaskDelete={setTaskToDelete}
        onTaskStatusChange={updateTaskStatus}
      />
    );
  };

  return (
    <>
      <header className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">TaskFlow Kanban</h1>
          <p className="mt-1 text-sm text-slate-600">Organize tarefas por prioridade e acompanhe o progresso do time.</p>
        </div>
        <Button onClick={openCreateTaskModal} className="gap-2" disabled={!isReady}>
          <Plus size={16} aria-hidden="true" />
          Nova tarefa
        </Button>
      </header>

      {isReady ? (
        <>
          <section className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumo por status">
            {TASK_STATUSES.map((status) => (
              <article key={status} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{STATUS_LABELS[status]}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{statusCounters[status]}</p>
              </article>
            ))}
          </section>

          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Filtros">
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <Input
                label="Buscar tarefas"
                type="search"
                placeholder="Digite título ou descrição"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <Select
                label="Filtrar prioridade"
                value={selectedPriority}
                onChange={(event) => setSelectedPriority(event.target.value as TaskPriority | "ALL")}
              >
                <option value="ALL">Todas</option>
                {Object.entries(PRIORITY_LABELS).map(([priority, label]) => (
                  <option key={priority} value={priority}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </section>
        </>
      ) : null}

      {renderContent()}

      {taskModal ? (
        <TaskModal
          key={taskModal.mode === "edit" ? taskModal.task.id : "create"}
          mode={taskModal.mode}
          task={taskModal.mode === "edit" ? taskModal.task : undefined}
          onClose={() => setTaskModal(null)}
          onSubmit={(payload) =>
            taskModal.mode === "create" ? createTask(payload) : updateTask(taskModal.task.id, payload)
          }
        />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(taskToDelete)}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir "${taskToDelete?.title ?? ""}"? Essa ação não poderá ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        isConfirming={isDeleting}
        onCancel={() => setTaskToDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
      />

      {isReady && tasks.length > 0 ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <ListFilter size={16} aria-hidden="true" />
          <span>
            {filteredTasks.length} de {tasks.length} tarefa(s)
            {hasActiveFilters ? " (com filtros aplicados)" : ""}
          </span>
        </div>
      ) : null}
    </>
  );
};
