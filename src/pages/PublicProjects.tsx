import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Clock, Plus, Calendar } from "lucide-react";
import { format } from "date-fns";
import { syncContractsToProjects } from "@/services/contractProjectSync";

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

interface Employee {
  id: string;
  name: string;
}

export default function PublicProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [hourEntryOpen, setHourEntryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Hour entry form
  const [hourForm, setHourForm] = useState({
    employee_id: "",
    date_worked: format(new Date(), "yyyy-MM-dd"),
    hours_worked: "",
    description: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Primeiro, sincronizar contratos para projetos (cria projetos que faltam)
      try {
        await syncContractsToProjects();
      } catch (syncError) {
        console.error('Error syncing contracts to projects:', syncError);
        // Não falha o carregamento se houver erro na sincronização
      }

      // Buscar TODOS os projetos ativos (incluindo os criados manualmente)
      const { data: projectsData, error: projectsError } = await supabase
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
        .eq('status', 'active') // Mostra todos os projetos ativos
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');

      if (employeesError) throw employeesError;

      setProjects(projectsData || []);
      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddHours = (project: Project) => {
    setSelectedProject(project);
    setHourForm({
      employee_id: "",
      date_worked: format(new Date(), "yyyy-MM-dd"),
      hours_worked: "",
      description: ""
    });
    setHourEntryOpen(true);
  };

  const handleSubmitHours = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject || !hourForm.employee_id || !hourForm.hours_worked) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('project_hours')
        .insert([{
          project_id: selectedProject.id,
          employee_id: hourForm.employee_id,
          date_worked: hourForm.date_worked,
          hours_worked: parseFloat(hourForm.hours_worked),
          description: hourForm.description
        }]);

      if (error) throw error;

      toast({
        title: "Horas adicionadas",
        description: "As horas foram registradas com sucesso.",
      });

      setHourEntryOpen(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error adding hours:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar as horas.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Projetos Ativos</h1>
          <p className="text-gray-600">Selecione um projeto para registrar suas horas trabalhadas</p>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum projeto ativo encontrado</h3>
              <p className="text-gray-600 text-center">
                Não há projetos ativos disponíveis no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </Badge>
                  </div>
                  {project.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Project Info */}
                  <div className="space-y-2">
                    {project.clients && (
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-500 mr-2">Cliente:</span>
                        <span>{project.clients.name}</span>
                      </div>
                    )}

                    {project.contratos && (
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-500 mr-2">Contrato:</span>
                          <span className="truncate">{project.contratos.scope || `#${project.contratos.id}`}</span>
                        </div>

                        {(project.contratos.start_date || project.contratos.end_date) && (
                          <div className="flex items-center text-sm">
                            <span className="font-medium text-gray-500 mr-2">Período:</span>
                            <span className="text-xs">
                              {project.contratos.start_date && new Date(project.contratos.start_date).toLocaleDateString('pt-BR')}
                              {project.contratos.start_date && project.contratos.end_date && ' - '}
                              {project.contratos.end_date && new Date(project.contratos.end_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleAddHours(project)}
                    className="w-full flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Registrar Horas
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Hour Entry Dialog */}
        <Dialog open={hourEntryOpen} onOpenChange={setHourEntryOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Registrar Horas - {selectedProject?.name}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmitHours} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Funcionário *</Label>
                <Select
                  value={hourForm.employee_id}
                  onValueChange={(value) => setHourForm({ ...hourForm, employee_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={hourForm.date_worked}
                  onChange={(e) => setHourForm({ ...hourForm, date_worked: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours">Horas Trabalhadas *</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                  value={hourForm.hours_worked}
                  onChange={(e) => setHourForm({ ...hourForm, hours_worked: e.target.value })}
                  placeholder="Ex: 8.5"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={hourForm.description}
                  onChange={(e) => setHourForm({ ...hourForm, description: e.target.value })}
                  placeholder="Descreva o trabalho realizado..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setHourEntryOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {submitting ? "Registrando..." : "Registrar Horas"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}