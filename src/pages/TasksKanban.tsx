import { useState, useEffect, useCallback } from "react";
import DOMPurify from "dompurify";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { StatusDialog } from "@/components/tasks/StatusDialog";
import { TaskComments } from "@/components/tasks/TaskComments";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTasks } from "@/hooks/useTasks";
import { useTaskStatuses } from "@/hooks/useTaskStatuses";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Settings, Loader2, FolderOpen, Share2, Users, Hash, ChevronRight, Search, X, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { ProjectTask, TaskStatus } from "@/types/task";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectOverview {
  id: number;
  name: string;
  status: string | null;
  created_at: string;
  client_name: string;
  client_id: string;
  task_count: number;
  submit_token?: string;
}

export default function TasksKanban() {
  const [allProjects, setAllProjects] = useState<ProjectOverview[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>();
  const [selectedProjectName, setSelectedProjectName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [initialStatusId, setInitialStatusId] = useState<string | undefined>();
  const [loadingOverview, setLoadingOverview] = useState(true);
  const { toast } = useToast();

  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, moveTask, toggleTaskPublic, addComment } = useTasks(selectedProjectId);
  const { statuses, loading: statusesLoading, createStatus, updateStatus, deleteStatus } = useTaskStatuses(selectedProjectId);

  useEffect(() => {
    fetchOverview();
    fetchEmployees();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoadingOverview(true);
      const { data: projectsData, error: projError } = await supabase
        .from('projetos')
        .select('id, name, status, created_at, client_id, submit_token, clients(id, name), project_tasks(id)')
        .not('client_id', 'is', null)
        .order('name', { ascending: true });

      if (projError) throw projError;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const overview: ProjectOverview[] = (projectsData || []).map((p: Record<string, any>) => ({
        id: p.id,
        name: p.name || 'Sem nome',
        status: p.status,
        created_at: p.created_at,
        client_name: p.clients?.name || 'Sem cliente',
        client_id: p.client_id,
        task_count: p.project_tasks?.length || 0,
        submit_token: p.submit_token,
      }));

      setAllProjects(overview);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos.",
        variant: "destructive",
      });
    } finally {
      setLoadingOverview(false);
    }
  };

  const handleSelectProject = (projectId: number) => {
    const proj = allProjects.find(p => p.id === projectId);
    setSelectedProjectId(projectId);
    setSelectedProjectName(proj ? `${proj.client_name} — ${proj.name}` : "");
    setSearchQuery("");
  };

  const handleBackToList = () => {
    setSelectedProjectId(undefined);
    setSelectedProjectName("");
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

  if (loadingOverview) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const currentProject = allProjects.find(p => p.id === selectedProjectId);

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {selectedProjectId ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleBackToList} className="gap-1 -ml-2">
                <ArrowLeft className="h-4 w-4" />
                Projetos
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold">{selectedProjectName}</h1>
            </>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold">Kanban de Atividades</h1>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  placeholder="Buscar cliente ou projeto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="!pl-10 pr-8"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          {currentProject?.submit_token && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = `${window.location.origin}/submit-task/${currentProject.submit_token}`;
                navigator.clipboard.writeText(link);
                toast({
                  title: "Link copiado!",
                  description: "Link de submissão pública copiado para a área de transferência.",
                });
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Link Público</span>
              <span className="sm:hidden">Link</span>
            </Button>
          )}
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
        <ProjectsOverviewList
          projects={allProjects}
          searchQuery={searchQuery}
          onSelectProject={(projectId) => handleSelectProject(projectId)}
        />
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
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedTask.description) }}
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
                  {selectedTask.task_type && (
                    <div>
                      <strong>Tipo:</strong>{" "}
                      {selectedTask.task_type === 'bug' ? '🐛 Bug' : '📋 Backlog'}
                    </div>
                  )}
                  {selectedTask.reported_by_name && (
                    <div>
                      <strong>Reportado por:</strong> {selectedTask.reported_by_name}
                      {selectedTask.reported_by_email && ` (${selectedTask.reported_by_email})`}
                    </div>
                  )}
                  {selectedTask.reported_url && (
                    <div className="col-span-2">
                      <strong>URL:</strong>{" "}
                      <a href={selectedTask.reported_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        {selectedTask.reported_url}
                      </a>
                    </div>
                  )}
                  {selectedTask.reported_view && (
                    <div>
                      <strong>Visão:</strong> {selectedTask.reported_view}
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

/* ───── Notion-style project listing ───── */

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  paused: { label: "Pausado", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  completed: { label: "Concluído", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
};

function ProjectsOverviewList({
  projects,
  searchQuery,
  onSelectProject,
}: {
  projects: ProjectOverview[];
  searchQuery: string;
  onSelectProject: (projectId: number) => void;
}) {
  // Deduplicate by name + client_id (merge task counts, keep highest id)
  const deduped = Object.values(
    projects.reduce<Record<string, ProjectOverview>>((acc, p) => {
      const key = `${p.client_id}::${p.name}`;
      if (!acc[key]) {
        acc[key] = { ...p };
      } else {
        acc[key].task_count += p.task_count;
        // Keep the project with the highest id (most recent)
        if (p.id > acc[key].id) {
          const totalTasks = acc[key].task_count;
          acc[key] = { ...p, task_count: totalTasks };
        }
      }
      return acc;
    }, {})
  );

  // Filter by search query
  const query = searchQuery.toLowerCase().trim();
  const filtered = query
    ? deduped.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.client_name.toLowerCase().includes(query)
      )
    : deduped;

  const sorted = filtered.sort(
    (a, b) => a.client_name.localeCompare(b.client_name) || a.name.localeCompare(b.name)
  );

  if (sorted.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {query ? "Nenhum resultado encontrado" : "Nenhum projeto encontrado"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[150px_1fr_100px_80px_90px_40px] gap-3 px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/40 border-b">
        <span>Cliente</span>
        <span>Projeto</span>
        <span>Status</span>
        <span>Tarefas</span>
        <span>Criado em</span>
        <span></span>
      </div>

      {/* Rows */}
      <div className="divide-y">
        {sorted.map((project) => {
          const st = statusConfig[project.status || ''] || { label: project.status || '—', className: "bg-muted text-muted-foreground" };

          return (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="w-full grid grid-cols-[150px_1fr_100px_80px_90px_40px] gap-3 items-center px-4 py-3 hover:bg-accent/50 transition-colors text-left group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm truncate">{project.client_name}</span>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate">{project.name}</span>
              </div>

              <Badge variant="outline" className={`text-[11px] justify-center ${st.className}`}>
                {st.label}
              </Badge>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Hash className="h-3.5 w-3.5" />
                {project.task_count}
              </div>

              <span className="text-xs text-muted-foreground">
                {new Date(project.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>

              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

