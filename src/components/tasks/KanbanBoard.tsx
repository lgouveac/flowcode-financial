import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { KanbanColumn } from "./KanbanColumn";
import type { ProjectTask, TaskStatus } from "@/types/task";
import { TaskCard } from "./TaskCard";

interface KanbanBoardProps {
  statuses: TaskStatus[];
  tasks: ProjectTask[];
  onTaskMove: (taskId: string, newStatusId: string, newPosition: number) => void;
  onTaskClick?: (task: ProjectTask) => void;
  onEditTask: (task: ProjectTask) => void;
  onDeleteTask: (task: ProjectTask) => void;
  onTogglePublic: (task: ProjectTask) => void;
  onCopyPublicLink: (task: ProjectTask) => void;
  onAddTask?: (statusId: string) => void;
}

export function KanbanBoard({
  statuses,
  tasks,
  onTaskMove,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  onTogglePublic,
  onCopyPublicLink,
  onAddTask,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Verificar se está movendo para uma coluna (status)
    const targetStatus = statuses.find((s) => s.id === overId);
    if (targetStatus) {
      // Mover para o final da coluna
      const tasksInStatus = tasks.filter((t) => t.status_id === targetStatus.id);
      const newPosition = tasksInStatus.length;
      onTaskMove(taskId, targetStatus.id, newPosition);
      return;
    }

    // Verificar se está movendo sobre outra tarefa
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      const targetStatusId = overTask.status_id;
      const tasksInStatus = tasks.filter((t) => t.status_id === targetStatusId);
      const targetIndex = tasksInStatus.findIndex((t) => t.id === overTask.id);
      onTaskMove(taskId, targetStatusId, targetIndex);
      return;
    }
  };

  const tasksByStatus = statuses.map((status) => ({
    status,
    tasks: tasks
      .filter((task) => task.status_id === status.id)
      .sort((a, b) => a.position - b.position),
  }));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {tasksByStatus.map(({ status, tasks: statusTasks }) => (
          <KanbanColumn
            key={status.id}
            status={status}
            tasks={statusTasks}
            onTaskClick={onTaskClick}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onTogglePublic={onTogglePublic}
            onCopyPublicLink={onCopyPublicLink}
            onAddTask={onAddTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-80">
            <TaskCard
              task={activeTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onTogglePublic={onTogglePublic}
              onCopyPublicLink={onCopyPublicLink}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

