import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { StatusDialog } from "@/components/tasks/StatusDialog";
import { TaskComments } from "@/components/tasks/TaskComments";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTasks } from "@/hooks/useTasks";
import { useTaskStatuses } from "@/hooks/useTaskStatuses";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Settings, Loader2, FolderOpen } from "lucide-react";
import type { ProjectTask, TaskStatus } from "@/types/task";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Project {
  id: number;
  name: string;
}

export default function TasksKanban() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [initialStatusId, setInitialStatusId] = useState<string | undefined>();
  const [loadingProjects, setLoadingProjects] = useState(true);
  const { toast } = useToast();

  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, moveTask, toggleTaskPublic, addComment } = useTasks(selectedProjectId);
  const { statuses, loading: statusesLoading, createStatus, updateStatus, deleteStatus } = useTaskStatuses(selectedProjectId);

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const { data, error } = await supabase
        .from('projetos')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;

      setProjects((data || []) as Project[]);
      
      // Selecionar o primeiro projeto automaticamente
      if (data && data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos.",
        variant: "destructive",
      });
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;

      setEmployees((data || []) as Array<{ id: string; name: string }>);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleCreateTask = async (taskData: Partial<ProjectTask>) => {
    if (!selectedProjectId) return;
    
    await createTask({
      ...taskData,
      project_id: selectedProjectId,
    } as Omit<ProjectTask, 'id' | 'created_at' | 'updated_at' | 'public_token' | 'project' | 'status' | 'assigned_employee' | 'created_by_user' | 'comments'>);
  };

  const handleUpdateTask = async (taskData: Partial<ProjectTask>) => {
    if (!taskData.id) return;
    await updateTask(taskData.id, taskData);
  };

  const handleSaveTask = async (taskData: Partial<ProjectTask>) => {
    if (taskData.id) {
      await handleUpdateTask(taskData);
    } else {
      await handleCreateTask(taskData);
    }
  };

  const handleDeleteTask = async (task: ProjectTask) => {
    if (confirm(`Tem certeza que deseja deletar a tarefa "${task.name}"?`)) {
      await deleteTask(task.id);
    }
  };

  const handleTogglePublic = async (task: ProjectTask) => {
    await toggleTaskPublic(task.id, !task.is_public);
  };

  const handleCopyPublicLink = async (task: ProjectTask) => {
    // Primeiro marcar como público se não estiver
    if (!task.is_public) {
      await toggleTaskPublic(task.id, true);
      // Aguardar um pouco para o token ser gerado
      setTimeout(async () => {
        const { data } = await supabase
          .from('project_tasks')
          .select('public_token')
          .eq('id', task.id)
          .single();
        
        if (data?.public_token) {
          const link = `${window.location.origin}/public-task/${data.public_token}`;
          navigator.clipboard.writeText(link);
          toast({
            title: "Link copiado!",
            description: "Link público copiado para a área de transferência.",
          });
        }
      }, 500);
    }
  };

  const handleSaveStatus = async (statusData: Partial<TaskStatus>) => {
    if (statusData.id) {
      await updateStatus(statusData.id, statusData);
    } else {
      await createStatus(statusData as Omit<TaskStatus, 'id' | 'created_at'>);
    }
  };

  const handleTaskClick = (task: ProjectTask) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  const handleAddTask = (statusId: string) => {
    setSelectedTask(null);
    setInitialStatusId(statusId);
    setTaskDialogOpen(true);
  };

  if (loadingProjects) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Kanban de Atividades</h1>
          <Select
            value={selectedProjectId?.toString() || ""}
            onValueChange={(value) => setSelectedProjectId(parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Selecione um projeto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    {project.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedStatus(null);
              setStatusDialogOpen(true);
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Gerenciar Status</span>
            <span className="sm:hidden">Status</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedTask(null);
              setInitialStatusId(undefined);
              setTaskDialogOpen(true);
            }}
            disabled={!selectedProjectId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {!selectedProjectId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Selecione um projeto para ver as tarefas</p>
          </CardContent>
        </Card>
      ) : tasksLoading || statusesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <KanbanBoard
          statuses={statuses}
          tasks={tasks}
          onTaskMove={moveTask}
          onTaskClick={handleTaskClick}
          onEditTask={(task) => {
            setSelectedTask(task);
            setTaskDialogOpen(true);
          }}
          onDeleteTask={handleDeleteTask}
          onTogglePublic={handleTogglePublic}
          onCopyPublicLink={handleCopyPublicLink}
          onAddTask={handleAddTask}
        />
      )}

      {/* Dialog de Tarefa */}
      <TaskDialog
        open={taskDialogOpen}
        onClose={() => {
          setTaskDialogOpen(false);
          setSelectedTask(null);
          setInitialStatusId(undefined);
        }}
        onSave={handleSaveTask}
        task={selectedTask}
        statuses={statuses}
        employees={employees}
        projectId={selectedProjectId!}
        initialStatusId={initialStatusId}
      />

      {/* Dialog de Status */}
      <StatusDialog
        open={statusDialogOpen}
        onClose={() => {
          setStatusDialogOpen(false);
          setSelectedStatus(null);
        }}
        onSave={handleSaveStatus}
        status={selectedStatus}
        projectId={selectedProjectId}
      />

      {/* Dialog de Detalhes da Tarefa */}
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
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedTask.description }}
                  />
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Status:</strong>{" "}
                    {selectedTask.status && (
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-1"
                        style={{ backgroundColor: selectedTask.status.color }}
                      />
                    )}
                    {selectedTask.status?.name}
                  </div>
                  {selectedTask.priority && (
                    <div>
                      <strong>Prioridade:</strong>{" "}
                      {selectedTask.priority === 'high' ? 'Alta' : selectedTask.priority === 'medium' ? 'Média' : 'Baixa'}
                    </div>
                  )}
                  {selectedTask.due_date && (
                    <div>
                      <strong>Vencimento:</strong>{" "}
                      {new Date(selectedTask.due_date).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  {selectedTask.assigned_employee && (
                    <div>
                      <strong>Atribuído a:</strong> {selectedTask.assigned_employee.name}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="comments">
                <TaskComments
                  task={selectedTask}
                  onAddComment={addComment}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

