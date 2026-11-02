import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { TASK_STATUSES, type Task, type TaskStatus } from "../../types/task";
import { groupTasksByStatus, resolveDropTargetStatus } from "../../utils/taskUtils";
import { TaskCard } from "./TaskCard";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  tasks: Task[];
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onTaskStatusChange: (taskId: string, status: TaskStatus) => Promise<void>;
}

export const KanbanBoard = ({ tasks, onTaskEdit, onTaskDelete, onTaskStatusChange }: KanbanBoardProps) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const tasksByStatus = useMemo(() => groupTasksByStatus(tasks), [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const draggedTask = tasks.find((task) => task.id === event.active.id);
    setActiveTask(draggedTask ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    if (!event.over) {
      return;
    }

    const destinationStatus = resolveDropTargetStatus(event.over.id, tasks);
    if (!destinationStatus) {
      return;
    }

    const draggedTaskId = String(event.active.id);
    const draggedTask = tasks.find((task) => task.id === draggedTaskId);

    if (!draggedTask || draggedTask.status === destinationStatus) {
      return;
    }

    void onTaskStatusChange(draggedTaskId, destinationStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TASK_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            onEditTask={onTaskEdit}
            onDeleteTask={onTaskDelete}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 cursor-grabbing">
            <TaskCard task={activeTask} onEdit={onTaskEdit} onDelete={onTaskDelete} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
