import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Edit, Save, X } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  client_id?: string;
  contract_id?: number;
  created_at: string;
  clients?: {
    id: string;
    name: string;
    email?: string;
  };
  contratos?: {
    id: number;
    scope: string;
    start_date?: string;
    end_date?: string;
    status?: string;
  };
}

export default function PublicProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state for editing
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active" as 'active' | 'paused' | 'completed'
  });

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projetos')
        .select(`
          *,
          clients (
            id,
            name,
            email
          ),
          contratos!projetos_contract_id_fkey (
            id,
            scope,
            start_date,
            end_date,
            status
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;

      setProject(data);
      setFormData({
        name: data.name || "",
        description: data.description || "",
        status: data.status || "active"
      });
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o projeto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('projetos')
        .update({
          name: formData.name,
          description: formData.description,
          status: formData.status
        })
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: "Projeto atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      setProject({
        ...project,
        name: formData.name,
        description: formData.description,
        status: formData.status
      });
      setEditing(false);
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        status: project.status || "active"
      });
    }
    setEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'paused': return 'Pausado';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Projeto não encontrado</h3>
            <p className="text-gray-600 text-center">
              O projeto solicitado não foi encontrado ou não está disponível.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="text-2xl">
                  {editing ? "Editando Projeto" : "Visualização do Projeto"}
                </CardTitle>
                <Badge className={getStatusColor(project.status)}>
                  {getStatusText(project.status)}
                </Badge>
              </div>
              {!editing ? (
                <Button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Project Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações do Projeto</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Projeto</Label>
                  {editing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Digite o nome do projeto"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded border">{project.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  {editing ? (
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'active' | 'paused' | 'completed') =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="paused">Pausado</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="p-2 bg-gray-50 rounded border">{getStatusText(project.status)}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                {editing ? (
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do projeto"
                    rows={4}
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded border min-h-[80px]">
                    {project.description || "Nenhuma descrição fornecida"}
                  </p>
                )}
              </div>
            </div>

            {/* Client Information */}
            {project.clients && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Cliente</Label>
                    <p className="p-2 bg-gray-50 rounded border">{project.clients.name}</p>
                  </div>
                  {project.clients.email && (
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <p className="p-2 bg-gray-50 rounded border">{project.clients.email}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contract Information */}
            {project.contratos && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações do Contrato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Escopo</Label>
                    <p className="p-2 bg-gray-50 rounded border">
                      {project.contratos.scope || `Contrato #${project.contratos.id}`}
                    </p>
                  </div>

                  {project.contratos.status && (
                    <div className="space-y-2">
                      <Label>Status do Contrato</Label>
                      <p className="p-2 bg-gray-50 rounded border capitalize">
                        {project.contratos.status}
                      </p>
                    </div>
                  )}

                  {project.contratos.start_date && (
                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <p className="p-2 bg-gray-50 rounded border">
                        {new Date(project.contratos.start_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}

                  {project.contratos.end_date && (
                    <div className="space-y-2">
                      <Label>Data de Término</Label>
                      <p className="p-2 bg-gray-50 rounded border">
                        {new Date(project.contratos.end_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Creation Date */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detalhes Adicionais</h3>
              <div className="space-y-2">
                <Label>Data de Criação</Label>
                <p className="p-2 bg-gray-50 rounded border">
                  {new Date(project.created_at).toLocaleDateString('pt-BR')} às {new Date(project.created_at).toLocaleTimeString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}