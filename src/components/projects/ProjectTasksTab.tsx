import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { StatusDialog } from "@/components/tasks/StatusDialog";
import { TaskComments } from "@/components/tasks/TaskComments";
import { useTasks } from "@/hooks/useTasks";
import { useTaskStatuses } from "@/hooks/useTaskStatuses";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Settings, Loader2, Share2 } from "lucide-react";
import type { ProjectTask, TaskStatus } from "@/types/task";

interface ProjectTasksTabProps {
  projectId: number;
  submitToken?: string;
}

export function ProjectTasksTab({ projectId, submitToken }: ProjectTasksTabProps) {
  const { toast } = useToast();
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, moveTask, toggleTaskPublic, addComment } = useTasks(projectId);
  const { statuses, loading: statusesLoading, createStatus, updateStatus, deleteStatus } = useTaskStatuses(projectId);

  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [initialStatusId, setInitialStatusId] = useState<string | undefined>();

  useEffect(() => {
    supabase.from("employees").select("id, name").order("name").then(({ data }) => {
      setEmployees((data || []) as Array<{ id: string; name: string }>);
    });
  }, []);

  const handleSaveTask = async (taskData: Partial<ProjectTask>) => {
    if (taskData.id) {
      await updateTask(taskData.id, taskData);
    } else {
      await createTask({
        ...taskData,
        project_id: projectId,
      } as Omit<ProjectTask, 'id' | 'created_at' | 'updated_at' | 'public_token' | 'project' | 'status' | 'assigned_employee' | 'created_by_user' | 'comments'>);
    }
  };

  const handleDeleteTask = async (task: ProjectTask) => {
    if (confirm(`Deletar a tarefa "${task.name}"?`)) {
      await deleteTask(task.id);
    }
  };

  const handleTogglePublic = async (task: ProjectTask) => {
    await toggleTaskPublic(task.id, !task.is_public);
  };

  const handleCopyPublicLink = async (task: ProjectTask) => {
    if (!task.is_public) {
      await toggleTaskPublic(task.id, true);
      setTimeout(async () => {
        const { data } = await supabase.from("project_tasks").select("public_token").eq("id", task.id).single();
        if (data?.public_token) {
          navigator.clipboard.writeText(`${window.location.origin}/public-task/${data.public_token}`);
          toast({ title: "Link copiado!", description: "Link público copiado." });
        }
      }, 500);
    } else if (task.public_token) {
      navigator.clipboard.writeText(`${window.location.origin}/public-task/${task.public_token}`);
      toast({ title: "Link copiado!", description: "Link público copiado." });
    }
  };

  const handleSaveStatus = async (statusData: Partial<TaskStatus>) => {
    if (statusData.id) {
      await updateStatus(statusData.id, statusData);
    } else {
      await createStatus(statusData as Omit<TaskStatus, 'id' | 'created_at'>);
    }
  };

  if (tasksLoading || statusesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2 justify-end flex-wrap">
        {submitToken && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/submit-task/${submitToken}`);
              toast({ title: "Link copiado!", description: "Link de submissão copiado." });
            }}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Link Público
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setSelectedStatus(null); setStatusDialogOpen(true); }}
        >
          <Settings className="h-4 w-4 mr-2" />
          Status
        </Button>
        <Button
          size="sm"
          onClick={() => { setSelectedTask(null); setInitialStatusId(undefined); setTaskDialogOpen(true); }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Kanban */}
      <KanbanBoard
        statuses={statuses}
        tasks={tasks}
        onTaskMove={moveTask}
        onTaskClick={(task) => { setSelectedTask(task); setTaskDetailOpen(true); }}
        onEditTask={(task) => { setSelectedTask(task); setTaskDialogOpen(true); }}
        onDeleteTask={handleDeleteTask}
        onTogglePublic={handleTogglePublic}
        onCopyPublicLink={handleCopyPublicLink}
        onAddTask={(statusId) => { setSelectedTask(null); setInitialStatusId(statusId); setTaskDialogOpen(true); }}
      />

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onClose={() => { setTaskDialogOpen(false); setSelectedTask(null); setInitialStatusId(undefined); }}
        onSave={handleSaveTask}
        task={selectedTask}
        statuses={statuses}
        employees={employees}
        projectId={projectId}
        initialStatusId={initialStatusId}
      />

      {/* Status Dialog */}
      <StatusDialog
        open={statusDialogOpen}
        onClose={() => { setStatusDialogOpen(false); setSelectedStatus(null); }}
        onSave={handleSaveStatus}
        status={selectedStatus}
        projectId={projectId}
      />

      {/* Task Detail Dialog */}
      <Dialog open={taskDetailOpen} onOpenChange={setTaskDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTask?.name}</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="comments">Comentários</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                {selectedTask.description && (
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedTask.description) }} />
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Status:</strong>{" "}
                    {selectedTask.status && <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: selectedTask.status.color }} />}
                    {selectedTask.status?.name}
                  </div>
                  {selectedTask.priority && (
                    <div><strong>Prioridade:</strong> {selectedTask.priority === 'high' ? 'Alta' : selectedTask.priority === 'medium' ? 'Média' : 'Baixa'}</div>
                  )}
                  {selectedTask.due_date && (
                    <div><strong>Vencimento:</strong> {new Date(selectedTask.due_date).toLocaleDateString('pt-BR')}</div>
                  )}
                  {selectedTask.assigned_employee && (
                    <div><strong>Atribuído a:</strong> {selectedTask.assigned_employee.name}</div>
                  )}
                  {selectedTask.task_type && (
                    <div><strong>Tipo:</strong> {selectedTask.task_type === 'bug' ? 'Bug' : 'Backlog'}</div>
                  )}
                  {selectedTask.reported_by_name && (
                    <div><strong>Reportado por:</strong> {selectedTask.reported_by_name}{selectedTask.reported_by_email && ` (${selectedTask.reported_by_email})`}</div>
                  )}
                  {selectedTask.reported_url && (
                    <div className="col-span-2">
                      <strong>URL:</strong>{" "}
                      <a href={selectedTask.reported_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{selectedTask.reported_url}</a>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="comments">
                <TaskComments task={selectedTask} onAddComment={async (content) => { await addComment(selectedTask.id, content); }} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
