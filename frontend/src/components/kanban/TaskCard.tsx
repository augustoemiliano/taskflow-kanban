import { CalendarDays, Pencil, Trash2 } from "lucide-react";
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

export const TaskCard = ({ task, onEdit, onDelete }: TaskCardProps) => (
  <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <h3 className="text-sm font-semibold text-slate-900">{task.title}</h3>
      <Badge label={PRIORITY_LABELS[task.priority]} className={PRIORITY_STYLES[task.priority]} />
    </div>

    {task.description ? <p className="mt-2 line-clamp-3 text-sm text-slate-600">{task.description}</p> : null}

    <div className="mt-4 flex items-center justify-between">
      <div className="inline-flex items-center gap-1 text-xs text-slate-500">
        <CalendarDays size={14} />
        <span>{formatTaskDate(task.updatedAt)}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" className="px-2 py-1" onClick={() => onEdit(task)}>
          <Pencil size={14} />
        </Button>
        <Button type="button" variant="secondary" className="px-2 py-1" onClick={() => onDelete(task)}>
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  </article>
);
