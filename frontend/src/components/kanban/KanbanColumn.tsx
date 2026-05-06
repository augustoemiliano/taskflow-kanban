import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import type { Task, TaskStatus } from "../../types/task";
import { STATUS_LABELS } from "../../constants/task";
import { EmptyState } from "../ui/EmptyState";
import { SortableTaskCard } from "./SortableTaskCard";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export const KanbanColumn = ({ status, tasks, onEditTask, onDeleteTask }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={`rounded-2xl border p-4 transition ${
        isOver ? "border-slate-400 bg-slate-100" : "border-slate-200 bg-slate-50"
      }`}
    >
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">{STATUS_LABELS[status]}</h2>
        <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">{tasks.length}</span>
      </header>

      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <EmptyState title="Sem tarefas" description="Arraste uma tarefa para esta coluna ou crie uma nova." />
          ) : (
            tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
};
