import { ListFilter, Plus } from "lucide-react";
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
import type { Task, TaskPriority } from "../types/task";
import { countTasksByStatus } from "../utils/taskUtils";

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

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<"create" | "edit">("create");
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const statusCounters = useMemo(() => countTasksByStatus(tasks), [tasks]);
  const hasActiveFilters = searchTerm.trim().length > 0 || selectedPriority !== "ALL";

  const openCreateTaskModal = () => {
    setTaskModalMode("create");
    setSelectedTask(undefined);
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setTaskModalMode("edit");
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
        Carregando tarefas...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-rose-700">Falha ao carregar tarefas</p>
        <p className="mt-1 text-sm text-rose-600">{errorMessage}</p>
        <Button className="mt-4" onClick={() => void loadTasks()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <>
      <header className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">TaskFlow Kanban</h1>
          <p className="mt-1 text-sm text-slate-600">Organize tarefas por prioridade e acompanhe o progresso do time.</p>
        </div>
        <Button onClick={openCreateTaskModal} className="gap-2">
          <Plus size={16} />
          Nova tarefa
        </Button>
      </header>

      <section className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(statusCounters).map(([status, count]) => (
          <article key={status} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{count}</p>
          </article>
        ))}
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input
            label="Buscar tarefas"
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

      {tasks.length === 0 ? (
        <EmptyState
          title="Nenhuma tarefa ainda"
          description="Comece criando sua primeira tarefa para visualizar o quadro Kanban."
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="Nenhuma tarefa encontrada com os filtros atuais"
          description="Ajuste a busca ou o filtro de prioridade para ver mais resultados."
        />
      ) : (
        <KanbanBoard
          tasks={filteredTasks}
          onTaskEdit={openEditTaskModal}
          onTaskDelete={(task) => setTaskToDelete(task)}
          onTaskStatusChange={updateTaskStatus}
        />
      )}

      <TaskModal
        isOpen={isTaskModalOpen}
        mode={taskModalMode}
        task={selectedTask}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={(payload) =>
          taskModalMode === "create" ? createTask(payload) : updateTask(selectedTask!.id, payload)
        }
      />

      <ConfirmDialog
        isOpen={Boolean(taskToDelete)}
        title="Excluir tarefa"
        description="Tem certeza que deseja excluir esta tarefa? Essa ação não poderá ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onCancel={() => setTaskToDelete(null)}
        onConfirm={() => {
          if (taskToDelete) {
            void deleteTask(taskToDelete.id);
            setTaskToDelete(null);
          }
        }}
      />

      <div className="mt-6 flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ListFilter size={16} />
          <span>
            {filteredTasks.length} de {tasks.length} tarefa(s)
            {hasActiveFilters ? " (com filtros aplicados)" : ""}
          </span>
        </div>
      </div>
    </>
  );
};
