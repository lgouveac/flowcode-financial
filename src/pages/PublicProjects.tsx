import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Clock, Plus, Calendar, Play, Pause, Square, X, Minimize2, Maximize2, Moon, Sun, Eye } from "lucide-react";
import { format, parseISO, eachDayOfInterval, differenceInDays } from "date-fns";
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
    date_worked: format(new Date(), "yyyy-MM-dd"),
    hours_worked: "",
    description: ""
  });

  // Period entry form
  const [periodForm, setPeriodForm] = useState({
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
    hours_type: "per_day" as "per_day" | "total_period",
    hours_value: "",
    description: ""
  });

  // Timer state
  const [timer, setTimer] = useState({
    isRunning: false,
    startTime: null as Date | null,
    elapsedSeconds: 0,
    projectId: "",
    projectName: "",
    employeeId: "",
    employeeName: ""
  });
  const [isTimerVisible, setIsTimerVisible] = useState(false);
  const [isTimerMinimized, setIsTimerMinimized] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('publicProjectsDarkMode');
      return saved === 'true';
    }
    return false;
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('publicProjectsDarkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('publicProjectsDarkMode', 'false');
    }
  }, [darkMode]);

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

      // Buscar todos os projetos (igual Projects.tsx)
      const { data: projectsData, error: projectsError } = await supabase
        .from('projetos')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Buscar dados relacionados separadamente para evitar duplicatas (igual Projects.tsx)
      const projectIds = (projectsData || []).map(p => p.id);

      // Buscar clientes
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name, email');

      // Buscar contratos
      const { data: contractsData } = await supabase
        .from('contratos')
        .select('id, scope, start_date, end_date, status, contract_type');

      // Combinar dados manualmente para evitar duplicatas (igual Projects.tsx)
      const processedProjects = (projectsData || []).map(project => {
        const client = clientsData?.find(c => c.id === project.client_id);
        const contract = contractsData?.find(c => c.id === project.contract_id);

        return {
          ...project,
          clients: client || null,
          contratos: contract || null
        };
      });

      // Remover projetos duplicados por contract_id (igual Projects.tsx)
      const finalProjects = [];
      const seenContractIds = new Set();
      const seenProjectIds = new Set();

      for (const project of processedProjects) {
        // Se tem contract_id, verificar se já foi processado
        if (project.contract_id) {
          if (!seenContractIds.has(project.contract_id)) {
            seenContractIds.add(project.contract_id);
            finalProjects.push(project);
          }
        } else {
          // Se não tem contract_id, verificar por project ID
          if (!seenProjectIds.has(project.id)) {
            seenProjectIds.add(project.id);
            finalProjects.push(project);
          }
        }
      }

      // Filtrar apenas projetos com contratos de escopo aberto
      const filteredProjects = finalProjects.filter(project => {
        const contract = project.contratos;
        return contract && contract.contract_type === 'open_scope';
      });

      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');

      if (employeesError) throw employeesError;

      setProjects(filteredProjects);
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
      date_worked: format(new Date(), "yyyy-MM-dd"),
      hours_worked: "",
      description: ""
    });
    setPeriodForm({
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: format(new Date(), "yyyy-MM-dd"),
      hours_type: "per_day",
      hours_value: "",
      description: ""
    });
    // Se o timer está rodando para este projeto, usar o funcionário do timer
    // Caso contrário, manter o funcionário selecionado anteriormente (se houver)
    if (timer.projectId === project.id && timer.employeeId) {
      setSelectedEmployee(timer.employeeId);
    } else if (!selectedEmployee) {
      // Se não há funcionário selecionado, manter vazio para o usuário escolher
      setSelectedEmployee("");
    }
    setHourEntryOpen(true);
  };

  const handleSubmitHours = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject || !selectedEmployee || !hourForm.hours_worked) {
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
          employee_id: selectedEmployee,
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

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isRunning && timer.startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - timer.startTime!.getTime()) / 1000);
        setTimer(prev => ({ ...prev, elapsedSeconds: elapsed }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.startTime]);

  // Load timer from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('publicProjectTimer');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning && parsed.startTime) {
          const now = new Date();
          const startTime = new Date(parsed.startTime);
          const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          setTimer({
            ...parsed,
            startTime,
            elapsedSeconds
          });
          setIsTimerVisible(true);
        } else {
          setTimer({
            ...parsed,
            startTime: parsed.startTime ? new Date(parsed.startTime) : null
          });
        }
      } catch {
        // Invalid saved data, ignore
      }
    }
  }, []);

  // Save timer to localStorage
  useEffect(() => {
    if (timer.projectId) {
      localStorage.setItem('publicProjectTimer', JSON.stringify(timer));
    }
  }, [timer]);

  const startTimer = (project: Project) => {
    if (!selectedEmployee) {
      toast({
        title: "Selecione um funcionário",
        description: "Por favor, selecione um funcionário antes de iniciar o timer.",
        variant: "destructive",
      });
      return;
    }

    const employee = employees.find(e => e.id === selectedEmployee);
    const startTime = new Date();
    setTimer({
      isRunning: true,
      startTime,
      elapsedSeconds: 0,
      projectId: project.id,
      projectName: project.name,
      employeeId: selectedEmployee,
      employeeName: employee?.name || ""
    });
    setIsTimerVisible(true);
    setIsTimerMinimized(false);

    toast({
      title: "Timer iniciado",
      description: `Timer para ${project.name} iniciado.`,
    });
  };

  const pauseTimer = () => {
    setTimer(prev => ({ ...prev, isRunning: false }));
  };

  const resumeTimer = () => {
    if (timer.startTime) {
      const newStartTime = new Date(Date.now() - timer.elapsedSeconds * 1000);
      setTimer(prev => ({ ...prev, isRunning: true, startTime: newStartTime }));
    }
  };

  const stopTimer = async () => {
    if (!timer.isRunning || !timer.startTime || !timer.projectId || !timer.employeeId) return;

    const hours = timer.elapsedSeconds / 3600;

    try {
      const { error } = await supabase
        .from('project_hours')
        .insert([{
          project_id: timer.projectId,
          employee_id: timer.employeeId,
          date_worked: format(new Date(), "yyyy-MM-dd"),
          hours_worked: hours,
          description: `Timer: ${Math.floor(timer.elapsedSeconds / 3600)}h ${Math.floor((timer.elapsedSeconds % 3600) / 60)}m`
        }]);

      if (error) throw error;

      toast({
        title: "Timer finalizado",
        description: `${hours.toFixed(2)} horas foram registradas para ${timer.projectName}.`,
      });

      setTimer({
        isRunning: false,
        startTime: null,
        elapsedSeconds: 0,
        projectId: "",
        projectName: "",
        employeeId: "",
        employeeName: ""
      });
      setIsTimerVisible(false);
      localStorage.removeItem('publicProjectTimer');
    } catch (error) {
      console.error('Error saving timer hours:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as horas do timer.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject || !selectedEmployee || !periodForm.hours_value) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const startDate = parseISO(periodForm.start_date);
      const endDate = parseISO(periodForm.end_date);
      const dates = eachDayOfInterval({ start: startDate, end: endDate });

      let entries: Array<{
        project_id: string;
        employee_id: string;
        date_worked: string;
        hours_worked: number;
        description?: string;
      }> = [];

      if (periodForm.hours_type === "per_day") {
        entries = dates.map(date => ({
          project_id: selectedProject.id,
          employee_id: selectedEmployee,
          date_worked: format(date, 'yyyy-MM-dd'),
          hours_worked: parseFloat(periodForm.hours_value),
          description: periodForm.description
        }));
      } else {
        const totalHours = parseFloat(periodForm.hours_value);
        const hoursPerDay = totalHours / dates.length;

        entries = dates.map(date => ({
          project_id: selectedProject.id,
          employee_id: selectedEmployee,
          date_worked: format(date, 'yyyy-MM-dd'),
          hours_worked: hoursPerDay,
          description: `${periodForm.description} (${totalHours}h distribuídas em ${dates.length} dias)`
        }));
      }

      const { error } = await supabase
        .from('project_hours')
        .insert(entries);

      if (error) throw error;

      const totalHours = entries.reduce((sum, entry) => sum + entry.hours_worked, 0);

      toast({
        title: "Horas adicionadas",
        description: `${entries.length} entradas foram registradas (${totalHours.toFixed(2)}h total).`,
      });

      setPeriodForm({
        start_date: format(new Date(), "yyyy-MM-dd"),
        end_date: format(new Date(), "yyyy-MM-dd"),
        hours_type: "per_day",
        hours_value: "",
        description: ""
      });

      setHourEntryOpen(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error adding period hours:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar as horas do período.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const isDark = darkMode;
    switch (status) {
      case 'active': return isDark ? 'bg-green-900/20 text-green-300 border-green-800' : 'bg-green-100 text-green-800';
      case 'paused': return isDark ? 'bg-yellow-900/20 text-yellow-300 border-yellow-800' : 'bg-yellow-100 text-yellow-800';
      case 'completed': return isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-800';
      default: return isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-800';
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
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center transition-colors`}>
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} py-8 transition-colors`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Projetos Ativos</h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Selecione um projeto para registrar suas horas trabalhadas</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center gap-2"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {darkMode ? 'Claro' : 'Escuro'}
          </Button>
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
              <Card 
                key={project.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setViewingProject(project)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <CardTitle className="text-lg line-clamp-2 flex-1">{project.name}</CardTitle>
                    <Badge className={`text-xs flex-shrink-0 ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </Badge>
                  </div>
                  {project.description && (
                    <p className={`text-sm line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {project.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Project Info */}
                  <div className="space-y-2">
                    {project.clients && (
                      <div className={`flex items-center text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                        <span className={`font-medium mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cliente:</span>
                        <span>{project.clients.name}</span>
                      </div>
                    )}

                    {project.contratos && (
                      <div className="space-y-1">
                        <div className={`flex items-center text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                          <span className={`font-medium mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Contrato:</span>
                          <span className="truncate">{project.contratos.scope || `#${project.contratos.id}`}</span>
                        </div>

                        {(project.contratos.start_date || project.contratos.end_date) && (
                          <div className={`flex items-center text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                            <span className={`font-medium mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Período:</span>
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

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {timer.isRunning && timer.projectId === project.id && (
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-xs text-green-800 dark:text-green-300">
                        Timer ativo para {timer.employeeName}
                      </div>
                    )}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                      // Se o timer está rodando para este projeto, usar o funcionário do timer
                      if (timer.projectId === project.id && timer.employeeId) {
                        setSelectedEmployee(timer.employeeId);
                      }
                      setHourEntryOpen(true);
                      }}
                      className="w-full flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4" />
                      Registrar Horas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Project Details Dialog */}
        <Dialog open={!!viewingProject} onOpenChange={(open) => !open && setViewingProject(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="line-clamp-2">
                {viewingProject?.name}
              </DialogTitle>
            </DialogHeader>

            {viewingProject && (
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(viewingProject.status)}>
                    {getStatusText(viewingProject.status)}
                  </Badge>
                </div>

                {/* Description */}
                {viewingProject.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Descrição</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {viewingProject.description}
                    </p>
                  </div>
                )}

                {/* Client Info */}
                {viewingProject.clients && (
                  <div>
                    <h3 className="font-semibold mb-2">Cliente</h3>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Nome:</span> {viewingProject.clients.name}
                      </p>
                      {viewingProject.clients.email && (
                        <p className="text-sm">
                          <span className="font-medium">Email:</span> {viewingProject.clients.email}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Contract Info */}
                {viewingProject.contratos && (
                  <div>
                    <h3 className="font-semibold mb-2">Contrato</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium mb-1">Escopo:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {viewingProject.contratos.scope || `Contrato #${viewingProject.contratos.id}`}
                        </p>
                      </div>

                      {(viewingProject.contratos.start_date || viewingProject.contratos.end_date) && (
                        <div>
                          <p className="text-sm font-medium mb-1">Período:</p>
                          <p className="text-sm text-muted-foreground">
                            {viewingProject.contratos.start_date && new Date(viewingProject.contratos.start_date).toLocaleDateString('pt-BR')}
                            {viewingProject.contratos.start_date && viewingProject.contratos.end_date && ' - '}
                            {viewingProject.contratos.end_date && new Date(viewingProject.contratos.end_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}

                      {viewingProject.contratos.status && (
                        <div>
                          <p className="text-sm font-medium mb-1">Status do Contrato:</p>
                          <Badge className={
                            viewingProject.contratos.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                          }>
                            {viewingProject.contratos.status === 'completed' ? 'Assinado' : 'Aguardando Assinatura'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      setSelectedProject(viewingProject);
                      // Se o timer está rodando para este projeto, usar o funcionário do timer
                      if (timer.projectId === viewingProject.id && timer.employeeId) {
                        setSelectedEmployee(timer.employeeId);
                      }
                      setViewingProject(null);
                      setHourEntryOpen(true);
                    }}
                    className="flex-1 flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Registrar Horas
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewingProject(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Hour Entry Dialog */}
        <Dialog open={hourEntryOpen} onOpenChange={setHourEntryOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Registrar Horas - {selectedProject?.name}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="hours" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="hours">Horas</TabsTrigger>
                <TabsTrigger value="period">Período</TabsTrigger>
              </TabsList>

              <TabsContent value="hours" className="space-y-4">
                {/* Timer Section */}
                {selectedProject && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Timer de Trabalho</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="timer-employee">Funcionário *</Label>
                        <Select
                          value={selectedEmployee}
                          onValueChange={setSelectedEmployee}
                          disabled={timer.isRunning && timer.projectId === selectedProject.id}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar funcionário" />
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

                      {timer.isRunning && timer.projectId === selectedProject.id && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>Timer ativo para {timer.employeeName}</strong>
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Use o modal no canto superior direito para controlar o timer.
                          </p>
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => selectedProject && startTimer(selectedProject)}
                        disabled={!selectedEmployee || (timer.isRunning && timer.projectId === selectedProject.id)}
                        className="w-full"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {timer.isRunning && timer.projectId === selectedProject.id ? "Timer Ativo" : "Iniciar Timer"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Adicionar Horas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitHours} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Funcionário *</Label>
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="period" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Adicionar Horas por Período</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePeriodSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="period-employee">Funcionário *</Label>
                        <Select
                          value={selectedEmployee}
                          onValueChange={setSelectedEmployee}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar funcionário" />
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

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start-date">Data Inicial *</Label>
                          <Input
                            id="start-date"
                            type="date"
                            value={periodForm.start_date}
                            onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="end-date">Data Final *</Label>
                          <Input
                            id="end-date"
                            type="date"
                            value={periodForm.end_date}
                            onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Tipo de Entrada *</Label>
                          <Select
                            value={periodForm.hours_type}
                            onValueChange={(value: "per_day" | "total_period") =>
                              setPeriodForm({ ...periodForm, hours_type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="per_day">Horas por dia</SelectItem>
                              <SelectItem value="total_period">Total de horas do período</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="hours-value">
                              {periodForm.hours_type === "per_day" ? "Horas por Dia *" : "Total de Horas *"}
                            </Label>
                            <Input
                              id="hours-value"
                              type="number"
                              step="0.5"
                              min="0"
                              value={periodForm.hours_value}
                              onChange={(e) => setPeriodForm({ ...periodForm, hours_value: e.target.value })}
                              placeholder={periodForm.hours_type === "per_day" ? "Ex: 8" : "Ex: 40"}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="period-description">Descrição</Label>
                            <Input
                              id="period-description"
                              value={periodForm.description}
                              onChange={(e) => setPeriodForm({ ...periodForm, description: e.target.value })}
                              placeholder="Descrição do trabalho"
                            />
                          </div>
                        </div>
                      </div>

                      {periodForm.start_date && periodForm.end_date && (
                        <div className="text-sm text-muted-foreground">
                          Total de dias: {differenceInDays(parseISO(periodForm.end_date), parseISO(periodForm.start_date)) + 1}
                          {periodForm.hours_value && (
                            <span>
                              {periodForm.hours_type === "per_day" ? (
                                <> | Total de horas: {((differenceInDays(parseISO(periodForm.end_date), parseISO(periodForm.start_date)) + 1) * parseFloat(periodForm.hours_value || "0")).toFixed(1)}h</>
                              ) : (
                                <> | {parseFloat(periodForm.hours_value).toFixed(1)}h distribuídas ({(parseFloat(periodForm.hours_value) / (differenceInDays(parseISO(periodForm.end_date), parseISO(periodForm.start_date)) + 1)).toFixed(1)}h por dia)</>
                              )}
                            </span>
                          )}
                        </div>
                      )}

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
                            <Calendar className="h-4 w-4" />
                          )}
                          {submitting ? "Adicionando..." : "Adicionar Período"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Timer Modal */}
        {isTimerVisible && timer.projectId && (
          <div className="fixed top-4 right-4 z-50">
            <Card className={`shadow-lg border-2 transition-all duration-200 ${
              timer.isRunning ? 'border-green-500 shadow-green-500/20' : 'border-yellow-500 shadow-yellow-500/20'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      timer.isRunning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                    }`} />
                    <span className="text-sm font-medium">
                      {isTimerMinimized ? timer.projectName : `${timer.projectName} - ${timer.employeeName}`}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {!isTimerMinimized && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsTimerMinimized(true)}
                        className="h-6 w-6 p-0"
                      >
                        <Minimize2 className="h-3 w-3" />
                      </Button>
                    )}
                    {isTimerMinimized && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsTimerMinimized(false)}
                        className="h-6 w-6 p-0"
                      >
                        <Maximize2 className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsTimerVisible(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {!isTimerMinimized ? (
                  <>
                    <div className="text-center mb-4">
                      <div className="text-2xl font-mono font-bold text-primary">
                        {formatTime(timer.elapsedSeconds)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {timer.employeeName}
                      </div>
                    </div>

                    <div className="flex justify-center gap-2">
                      {timer.isRunning ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={pauseTimer}
                          className="gap-2"
                        >
                          <Pause className="h-3 w-3" />
                          Pausar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={resumeTimer}
                          className="gap-2"
                        >
                          <Play className="h-3 w-3" />
                          Continuar
                        </Button>
                      )}

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={stopTimer}
                        className="gap-2"
                      >
                        <Square className="h-3 w-3" />
                        Finalizar
                      </Button>
                    </div>

                    <div className="text-center text-xs text-muted-foreground mt-3">
                      {timer.isRunning ? "Timer em execução" : "Timer pausado"}
                    </div>
                  </>
                ) : (
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setIsTimerMinimized(false)}
                  >
                    <div className="text-lg font-mono font-bold">
                      {formatTime(timer.elapsedSeconds)}
                    </div>
                    <div className="flex gap-1">
                      {timer.isRunning ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            pauseTimer();
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Pause className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            resumeTimer();
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          stopTimer();
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Square className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}