import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import type { KeyboardEvent, PointerEvent } from "react";
import { PRIORITY_LABELS, PRIORITY_STYLES } from "../../constants/task";
import type { Task } from "../../types/task";
import { formatTaskDate } from "../../utils/taskUtils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

// Keeps clicks/keys on the action buttons from starting a drag in the parent sortable.
const stopDragPropagation = (event: PointerEvent | KeyboardEvent) => event.stopPropagation();

export const TaskCard = ({ task, onEdit, onDelete }: TaskCardProps) => (
  <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
    <div className="flex items-start justify-between gap-3">
      <h3 className="break-words text-sm font-semibold text-slate-900">{task.title}</h3>
      <Badge label={PRIORITY_LABELS[task.priority]} className={PRIORITY_STYLES[task.priority]} />
    </div>

    {task.description ? (
      <p className="mt-2 line-clamp-3 break-words text-sm text-slate-600">{task.description}</p>
    ) : null}

    <div className="mt-4 flex items-center justify-between">
      <div className="inline-flex items-center gap-1 text-xs text-slate-500" title="Última atualização">
        <CalendarDays size={14} aria-hidden="true" />
        <span>{formatTaskDate(task.updatedAt)}</span>
      </div>

      <div className="flex items-center gap-2" onPointerDown={stopDragPropagation} onKeyDown={stopDragPropagation}>
        <Button
          type="button"
          variant="secondary"
          className="px-2 py-1"
          onClick={() => onEdit(task)}
          aria-label={`Editar tarefa ${task.title}`}
          title="Editar"
        >
          <Pencil size={14} aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="px-2 py-1"
          onClick={() => onDelete(task)}
          aria-label={`Excluir tarefa ${task.title}`}
          title="Excluir"
        >
          <Trash2 size={14} aria-hidden="true" />
        </Button>
      </div>
    </div>
  </article>
);
