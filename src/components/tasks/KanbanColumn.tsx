import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SortableTaskCard } from "./SortableTaskCard";
import type { ProjectTask, TaskStatus } from "@/types/task";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: ProjectTask[];
  onTaskClick?: (task: ProjectTask) => void;
  onEditTask: (task: ProjectTask) => void;
  onDeleteTask: (task: ProjectTask) => void;
  onTogglePublic: (task: ProjectTask) => void;
  onCopyPublicLink: (task: ProjectTask) => void;
  onAddTask?: (statusId: string) => void;
}

export function KanbanColumn({
  status,
  tasks,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  onTogglePublic,
  onCopyPublicLink,
  onAddTask,
}: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-72 sm:w-80">
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <CardTitle className="text-sm font-semibold">
                {status.name}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {tasks.length}
              </Badge>
            </div>
            {onAddTask && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 min-h-[44px] min-w-[44px]"
                onClick={() => onAddTask(status.id)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto pb-4">
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {tasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onTogglePublic={onTogglePublic}
                  onCopyPublicLink={onCopyPublicLink}
                  onClick={onTaskClick}
                />
              ))}
              {tasks.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Nenhuma tarefa
                </div>
              )}
            </div>
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}

