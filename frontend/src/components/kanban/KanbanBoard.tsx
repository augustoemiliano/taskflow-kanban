import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { TASK_STATUSES, type Task, type TaskStatus } from "../../types/task";
import { TaskCard } from "./TaskCard";
import { KanbanColumn } from "./KanbanColumn";

/**
 * DndKit may report `over.id` as the column droppable (TODO, IN_PROGRESS, …) or as
 * a sortable task id (UUID) when the pointer releases over a card. We must map both
 * to a target column status, otherwise moving back to "A Fazer" over an existing
 * card would send an invalid status to the API.
 */
const resolveDropTargetStatus = (overId: string | number, allTasks: Task[]): TaskStatus | null => {
  const overIdString = String(overId);

  if ((TASK_STATUSES as readonly string[]).includes(overIdString)) {
    return overIdString as TaskStatus;
  }

  const targetTask = allTasks.find((task) => task.id === overIdString);
  if (targetTask) {
    return targetTask.status;
  }

  return null;
};

interface KanbanBoardProps {
  tasks: Task[];
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  onTaskStatusChange: (taskId: string, status: TaskStatus) => Promise<void>;
}

export const KanbanBoard = ({ tasks, onTaskEdit, onTaskDelete, onTaskStatusChange }: KanbanBoardProps) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const tasksByStatus = useMemo(() => {
    return TASK_STATUSES.reduce<Record<TaskStatus, Task[]>>(
      (accumulator, status) => {
        accumulator[status] = tasks.filter((task) => task.status === status);
        return accumulator;
      },
      {
        TODO: [],
        IN_PROGRESS: [],
        REVIEW: [],
        DONE: []
      }
    );
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const draggedTask = tasks.find((task) => task.id === event.active.id);
    setActiveTask(draggedTask ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
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

    await onTaskStatusChange(draggedTaskId, destinationStatus);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 lg:grid-cols-4">
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
        {activeTask ? <TaskCard task={activeTask} onEdit={onTaskEdit} onDelete={onTaskDelete} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
