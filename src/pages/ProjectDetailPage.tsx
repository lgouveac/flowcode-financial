import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Check, X, Trash2, Link as LinkIcon, FileText, Shield, ArrowUpRight } from "lucide-react";
import type { Project } from "@/types/project";
import { ProjectGithubTab } from "@/components/projects/ProjectGithubTab";
import { ProjectPRDEditor } from "@/components/projects/ProjectPRDEditor";
import { ProjectCredentialsTable } from "@/components/access-vault/ProjectCredentialsTable";
import { ProjectAccessTable } from "@/components/projects/ProjectAccessTable";
import { ProjectHoursTab } from "@/components/projects/ProjectHoursTab";
import { ProjectTasksTab } from "@/components/projects/ProjectTasksTab";
import { Separator } from "@/components/ui/separator";
import { ListTodo } from "lucide-react";

const statusLabels: Record<string, string> = {
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
};

const VALID_TABS = ["code", "prd", "access", "tasks", "hours"] as const;
type TabValue = typeof VALID_TABS[number];

export default function ProjectDetailPage() {
  const { projectId, tab } = useParams<{ projectId: string; tab?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);

  const activeTab: TabValue = VALID_TABS.includes(tab as TabValue) ? (tab as TabValue) : "code";

  useEffect(() => {
    if (projectId) fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const { data: projectData, error } = await supabase
        .from("projetos")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;

      // Fetch client separately
      let clientData = null;
      if (projectData.client_id) {
        const { data } = await supabase.from("clients").select("id, name").eq("id", projectData.client_id).single();
        clientData = data;
      }

      const fullProject = { ...projectData, clients: clientData } as Project;
      setProject(fullProject);
      setProjectName(fullProject.name);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar o projeto.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    navigate(`/projects/${projectId}/${value}`, { replace: true });
  };

  const saveProjectName = async () => {
    if (!projectName.trim() || !project) return;
    try {
      setSaving(true);
      const { error } = await supabase.from("projetos").update({ name: projectName.trim() }).eq("id", project.id);
      if (error) throw error;
      toast({ title: "Nome atualizado" });
      setEditingName(false);
      fetchProject();
    } catch {
      toast({ title: "Erro", description: "Não foi possível atualizar o nome.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (!window.confirm(`Tem certeza que deseja excluir "${project.name}"? Todas as horas também serão excluídas.`)) return;
    try {
      setSaving(true);
      await supabase.from("project_hours").delete().eq("project_id", project.id);
      const { error } = await supabase.from("projetos").delete().eq("id", project.id);
      if (error) throw error;
      toast({ title: "Projeto excluído" });
      navigate(project.client_id ? `/clients/${project.client_id}` : "/projects", { replace: true });
    } catch {
      toast({ title: "Erro", description: "Não foi possível excluir o projeto.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-20 text-muted-foreground">Projeto não encontrado.</div>;
  }

  const breadcrumbItems = [
    { label: "Projetos", href: "/projects" },
    { label: project.name },
  ];

  return (
    <div className="space-y-6">
      <PageBreadcrumb items={breadcrumbItems} />

      {/* Project Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveProjectName();
                    if (e.key === "Escape") { setProjectName(project.name); setEditingName(false); }
                  }}
                  className="text-lg font-semibold w-64"
                  autoFocus
                />
                <Button size="sm" onClick={saveProjectName} disabled={saving}><Check className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => { setProjectName(project.name); setEditingName(false); }}><X className="h-4 w-4" /></Button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <Button size="sm" variant="ghost" onClick={() => setEditingName(true)} className="h-8 w-8 p-0">
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            <Badge className={statusColors[project.status] || "bg-gray-100 text-gray-800"}>
              {statusLabels[project.status] || project.status}
            </Badge>
          </div>

          {/* Client link */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {project.clients && (
              <Link to={`/clients/${project.clients.id}`} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                Cliente: <span className="font-medium text-foreground">{project.clients.name}</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
            {project.github_repo_full_name && (
              <a href={project.github_repo_url || `https://github.com/${project.github_repo_full_name}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                {project.github_repo_full_name}
                <ArrowUpRight className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        <Button variant="destructive" size="sm" onClick={handleDeleteProject} disabled={saving}>
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="code">Código</TabsTrigger>
          <TabsTrigger value="prd">
            <FileText className="h-4 w-4 mr-2" />
            PRD
          </TabsTrigger>
          <TabsTrigger value="access">
            <Shield className="h-4 w-4 mr-2" />
            Acessos
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ListTodo className="h-4 w-4 mr-2" />
            Tarefas
          </TabsTrigger>
          <TabsTrigger value="hours">Horas</TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="space-y-4">
          <ProjectGithubTab project={project} onRefresh={(updated) => { if (updated) setProject(updated as Project); else fetchProject(); }} />
        </TabsContent>

        <TabsContent value="prd" className="space-y-4">
          <ProjectPRDEditor projectId={Number(project.id)} initialPRD={project.prd} onSave={() => fetchProject()} />
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <ProjectCredentialsTable projectId={Number(project.id)} />
          <Separator />
          <ProjectAccessTable projectId={Number(project.id)} />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <ProjectTasksTab projectId={Number(project.id)} submitToken={project.submit_token} />
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <ProjectHoursTab project={project} onRefresh={(updated) => { if (updated) setProject(updated as Project); else fetchProject(); }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
