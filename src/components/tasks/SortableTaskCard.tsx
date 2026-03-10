import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "./TaskCard";
import type { ProjectTask } from "@/types/task";

interface SortableTaskCardProps {
  task: ProjectTask;
  onEdit: (task: ProjectTask) => void;
  onDelete: (task: ProjectTask) => void;
  onTogglePublic: (task: ProjectTask) => void;
  onCopyPublicLink: (task: ProjectTask) => void;
  onClick?: (task: ProjectTask) => void;
}

export function SortableTaskCard({
  task,
  onEdit,
  onDelete,
  onTogglePublic,
  onCopyPublicLink,
  onClick,
}: SortableTaskCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(task)}
      className="cursor-grab active:cursor-grabbing"
    >
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePublic={onTogglePublic}
        onCopyPublicLink={onCopyPublicLink}
      />
    </div>
  );
}




