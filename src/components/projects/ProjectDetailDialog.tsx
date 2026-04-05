import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link, Edit, Check, X, Trash2 } from "lucide-react";
import type { Project } from "@/types/project";
import { ProjectPRDEditor } from "./ProjectPRDEditor";
import { ProjectAccessTable } from "./ProjectAccessTable";
import { ProjectCredentialsTable } from "@/components/access-vault/ProjectCredentialsTable";
import { ProjectGithubTab } from "./ProjectGithubTab";
import { ProjectHoursTab } from "./ProjectHoursTab";
import { Separator } from "@/components/ui/separator";
import { FileText, Shield } from "lucide-react";

interface ProjectDetailDialogProps {
  project: Project;
  open: boolean;
  onClose: () => void;
  onRefresh: (updatedProject?: Project) => void;
}

export const ProjectDetailDialog = ({ project, open, onClose, onRefresh }: ProjectDetailDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState(false);
  const [projectName, setProjectName] = useState(project.name);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setProjectName(project.name);
    }
  }, [open, project.name]);

  const saveProjectName = async () => {
    if (!projectName.trim()) {
      toast({ title: "Nome obrigatório", description: "O nome do projeto é obrigatório.", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.from('projetos').update({ name: projectName.trim() }).eq('id', project.id);
      if (error) throw error;
      toast({ title: "Nome atualizado", description: "O nome do projeto foi atualizado com sucesso." });
      setEditingProjectName(false);
      onRefresh();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar o nome do projeto.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const cancelEditProjectName = () => {
    setProjectName(project.name);
    setEditingProjectName(false);
  };

  const handleDeleteProject = async () => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o projeto "${project.name}"? Esta ação não pode ser desfeita e todas as horas registradas neste projeto também serão excluídas.`
    );
    if (!confirmed) return;
    try {
      setLoading(true);
      const { error: hoursError } = await supabase.from('project_hours').delete().eq('project_id', project.id);
      if (hoursError) throw hoursError;
      const { error: projectError } = await supabase.from('projetos').delete().eq('id', project.id);
      if (projectError) throw projectError;
      toast({ title: "Projeto excluído", description: "O projeto foi excluído com sucesso." });
      onRefresh();
      onClose();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível excluir o projeto.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyPublicLink = () => {
    const publicUrl = `${window.location.origin}/projects`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      toast({ title: "Link copiado", description: "O link público dos projetos foi copiado para a área de transferência." });
    }).catch(() => {
      toast({ title: "Erro", description: "Não foi possível copiar o link.", variant: "destructive" });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {editingProjectName ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveProjectName();
                      if (e.key === 'Escape') cancelEditProjectName();
                    }}
                    className="text-lg font-semibold"
                    autoFocus
                  />
                  <Button size="sm" onClick={saveProjectName} disabled={loading}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditProjectName}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <DialogTitle>{projectName}</DialogTitle>
                  <Button size="sm" variant="ghost" onClick={() => setEditingProjectName(true)} className="h-8 w-8 p-0">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyPublicLink} className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Link Projetos Públicos
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteProject} className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Excluir Projeto
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="code" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="code">Código</TabsTrigger>
            <TabsTrigger value="prd">
              <FileText className="h-4 w-4 mr-2" />
              PRD
            </TabsTrigger>
            <TabsTrigger value="access">
              <Shield className="h-4 w-4 mr-2" />
              Acessos
            </TabsTrigger>
            <TabsTrigger value="hours">Horas</TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="space-y-4">
            <ProjectGithubTab project={project} onRefresh={onRefresh} />
          </TabsContent>

          <TabsContent value="prd" className="space-y-4">
            <ProjectPRDEditor
              projectId={Number(project.id)}
              initialPRD={project.prd}
              onSave={() => onRefresh()}
            />
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            <ProjectCredentialsTable projectId={Number(project.id)} />
            <Separator />
            <ProjectAccessTable projectId={Number(project.id)} />
          </TabsContent>

          <TabsContent value="hours" className="space-y-4">
            <ProjectHoursTab project={project} onRefresh={onRefresh} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
