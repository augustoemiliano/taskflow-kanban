import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../../types/task";
import { STATUS_LABELS } from "../../constants/task";
import { TaskCard } from "./TaskCard";

interface SortableTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export const SortableTaskCard = ({ task, onEdit, onDelete }: SortableTaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1
      }}
      className="cursor-grab rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-slate-500 active:cursor-grabbing"
      {...attributes}
      aria-roledescription="cartão arrastável"
      aria-label={`${task.title} — ${STATUS_LABELS[task.status]}. Pressione espaço para mover.`}
      {...listeners}
    >
      <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
};
