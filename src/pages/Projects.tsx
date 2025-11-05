import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileText, RefreshCw, Search, Filter, X, Clock, Play, Pause, Square, Minimize2, Maximize2, Calendar, Loader2, Eye } from "lucide-react";
import { NewProjectDialog } from "@/components/projects/NewProjectDialog";
import { ProjectDetailDialog } from "@/components/projects/ProjectDetailDialog";
import { syncContractsToProjects } from "@/services/contractProjectSync";
import type { Project } from "@/types/project";
import { format, parseISO, eachDayOfInterval, differenceInDays } from "date-fns";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectDetailOpen, setProjectDetailOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("open_scope");
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);
  const [employees, setEmployees] = useState<Array<{id: string, name: string}>>([]);
  const [hourEntryOpen, setHourEntryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProjectForHours, setSelectedProjectForHours] = useState<Project | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
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

  useEffect(() => {
    fetchProjects();
    fetchClients();
    fetchEmployees();
  }, []);

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
    const saved = localStorage.getItem('projectsTimer');
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
      localStorage.setItem('projectsTimer', JSON.stringify(timer));
    }
  }, [timer]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log("🏗️ Starting projects fetch...");

      // Sincronização de contratos desabilitada temporariamente para evitar duplicatas
      // try {
      //   console.log("🔄 Running contract sync before fetching projects...");
      //   await syncContractsToProjects();
      //   console.log("✅ Contract sync completed");
      // } catch (syncError) {
      //   console.error('❌ Error syncing contracts to projects:', syncError);
      //   // Não falha o carregamento se houver erro na sincronização
      // }

      // Buscar projetos básicos primeiro
      console.log("📊 Fetching projects from database...");
      const { data: projectsData, error: projectsError } = await supabase
        .from('projetos')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Buscar dados relacionados separadamente para evitar duplicatas
      const projectIds = (projectsData || []).map(p => p.id);

      // Buscar clientes
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name, email');

      // Buscar contratos
      const { data: contractsData } = await supabase
        .from('contratos')
        .select('id, scope, start_date, end_date, status, contract_type');

      // Combinar dados manualmente para evitar duplicatas
      const processedProjects = (projectsData || []).map(project => {
        const client = clientsData?.find(c => c.id === project.client_id);
        const contract = contractsData?.find(c => c.id === project.contract_id);

        return {
          ...project,
          clients: client || null,
          contratos: contract || null
        };
      });

      // Remover projetos duplicados por contract_id (se existir)
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

      const data = finalProjects;


      console.log(`📋 Found ${data?.length || 0} total projects in database`);
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) {
        console.error("Error fetching clients:", error);
        return;
      }

      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');

      if (error) {
        console.error("Error fetching employees:", error);
        return;
      }

      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
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

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Client filter
      const clientMatch = selectedClientId === "all" || project.client_id === selectedClientId;

      // Scope filter - contratos agora é sempre um objeto único ou null
      const contract = project.contratos;

      const scopeMatch = scopeFilter === "all" ||
        (scopeFilter === "open_scope" && contract?.contract_type === "open_scope") ||
        (scopeFilter === "closed_scope" && contract?.contract_type === "closed_scope") ||
        (scopeFilter === "no_contract" && !contract);

      // Search filter
      const searchMatch = searchTerm === "" ||
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract?.scope?.toLowerCase().includes(searchTerm.toLowerCase());

      return clientMatch && scopeMatch && searchMatch;
    });
  }, [projects, selectedClientId, scopeFilter, searchTerm]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedClientId("all");
    setScopeFilter("open_scope");
  };

  // Prepare client options for the combobox
  const clientOptions = useMemo(() => {
    return [
      { value: "all", label: "Todos os clientes" },
      ...clients.map(client => ({
        value: client.id,
        label: client.name
      }))
    ];
  }, [clients]);

  const scopeOptions = [
    { value: "open_scope", label: "Escopo Aberto" },
    { value: "closed_scope", label: "Escopo Fechado" },
    { value: "no_contract", label: "Sem Contrato" },
    { value: "all", label: "Todos" }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Projetos</h1>
            <p className="text-muted-foreground">Gerencie projetos e acompanhe horas trabalhadas</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setProjectDetailOpen(true);
  };

  const handleAddHours = (project: Project) => {
    setSelectedProjectForHours(project);
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
    if (timer.projectId === project.id && timer.employeeId) {
      setSelectedEmployee(timer.employeeId);
    } else if (!selectedEmployee) {
      setSelectedEmployee("");
    }
    setHourEntryOpen(true);
  };

  const handleSubmitHours = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProjectForHours || !selectedEmployee || !hourForm.hours_worked) {
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
          project_id: selectedProjectForHours.id,
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
      setSelectedProjectForHours(null);
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

  const handlePeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProjectForHours || !selectedEmployee || !periodForm.hours_value) {
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
          project_id: selectedProjectForHours.id,
          employee_id: selectedEmployee,
          date_worked: format(date, 'yyyy-MM-dd'),
          hours_worked: parseFloat(periodForm.hours_value),
          description: periodForm.description
        }));
      } else {
        const totalHours = parseFloat(periodForm.hours_value);
        const hoursPerDay = totalHours / dates.length;

        entries = dates.map(date => ({
          project_id: selectedProjectForHours.id,
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
      setSelectedProjectForHours(null);
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
      localStorage.removeItem('projectsTimer');
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

  const handleForceSync = async () => {
    try {
      setSyncing(true);
      await syncContractsToProjects();
      await fetchProjects();
      toast({
        title: "Sincronização concluída",
        description: "Projetos foram sincronizados com os contratos.",
      });
    } catch (error) {
      console.error('Error in manual sync:', error);
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar os projetos.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projetos</h1>
          <p className="text-muted-foreground">Gerencie projetos e acompanhe horas trabalhadas</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleForceSync}
            disabled={syncing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
          <Button onClick={() => setNewProjectOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome do projeto, descrição, cliente ou contrato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={scopeFilter} onValueChange={setScopeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scopeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Combobox
            items={clientOptions}
            value={selectedClientId}
            onValueChange={setSelectedClientId}
            placeholder="Filtrar por cliente"
            searchPlaceholder="Buscar cliente..."
            emptyText="Nenhum cliente encontrado"
            className="w-[220px]"
          />

          {(searchTerm || selectedClientId !== "all" || scopeFilter !== "open_scope") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      {(searchTerm || selectedClientId !== "all") && (
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredProjects.length} de {projects.length} projetos
          {searchTerm && (
            <span> • Busca: "<span className="font-medium">{searchTerm}</span>"</span>
          )}
          {selectedClientId !== "all" && (
            <span> • Cliente: <span className="font-medium">
              {clients.find(c => c.id === selectedClientId)?.name}
            </span></span>
          )}
          {scopeFilter !== "open_scope" && (
            <span> • Tipo: <span className="font-medium">
              {scopeOptions.find(s => s.value === scopeFilter)?.label}
            </span></span>
          )}
        </div>
      )}

      {filteredProjects.length === 0 && projects.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum projeto encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Tente ajustar os filtros ou termo de busca
            </p>
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum projeto encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie seu primeiro projeto para começar a acompanhar horas
            </p>
            <Button onClick={() => setNewProjectOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Projeto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleProjectClick(project)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                    {getStatusText(project.status)}
                  </Badge>
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Project Info */}
                <div className="space-y-2">
                  {project.clients && (
                    <div className="flex items-center text-sm">
                      <span className="font-medium text-muted-foreground mr-2">Cliente:</span>
                      <span>{project.clients.name}</span>
                    </div>
                  )}
                  {project.contratos && (
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-muted-foreground mr-2">Contrato:</span>
                        <span className="truncate">{project.contratos.scope || `#${project.contratos.id}`}</span>
                      </div>

                      {(project.contratos.start_date || project.contratos.end_date) && (
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-muted-foreground mr-2">Período:</span>
                          <span className="text-xs">
                            {project.contratos.start_date && new Date(project.contratos.start_date).toLocaleDateString('pt-BR')}
                            {project.contratos.start_date && project.contratos.end_date && ' - '}
                            {project.contratos.end_date && new Date(project.contratos.end_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}

                      {project.contratos.status && (
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-muted-foreground mr-2">Status:</span>
                          <span className="capitalize text-xs px-2 py-1 rounded-full bg-muted">
                            {project.contratos.status}
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
                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddHours(project);
                      }}
                      className="flex-1 flex items-center gap-2"
                      size="sm"
                    >
                      <Clock className="h-4 w-4" />
                      Registrar Horas
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingProject(project);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NewProjectDialog
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onSuccess={() => {
          setNewProjectOpen(false);
          fetchProjects();
        }}
      />

      {selectedProject && (
        <ProjectDetailDialog
          project={selectedProject}
          open={projectDetailOpen}
          onClose={() => {
            setProjectDetailOpen(false);
            setSelectedProject(null);
          }}
          onRefresh={fetchProjects}
        />
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
                    handleAddHours(viewingProject);
                    setViewingProject(null);
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
              Registrar Horas - {selectedProjectForHours?.name}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="hours" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hours">Horas</TabsTrigger>
              <TabsTrigger value="period">Período</TabsTrigger>
            </TabsList>

            <TabsContent value="hours" className="space-y-4">
              {/* Timer Section */}
              {selectedProjectForHours && (
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
                        disabled={timer.isRunning && timer.projectId === selectedProjectForHours.id}
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

                    {timer.isRunning && timer.projectId === selectedProjectForHours.id && (
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
                      onClick={() => selectedProjectForHours && startTimer(selectedProjectForHours)}
                      disabled={!selectedEmployee || (timer.isRunning && timer.projectId === selectedProjectForHours.id)}
                      className="w-full"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {timer.isRunning && timer.projectId === selectedProjectForHours.id ? "Timer Ativo" : "Iniciar Timer"}
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
  );
}