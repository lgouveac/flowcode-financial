import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Play, Pause, Square, Download, Calendar, Plus, Trash2, Link, Edit, Check, X } from "lucide-react";
import { format, differenceInDays, eachDayOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Project, ProjectHour } from "@/types/project";
import { useTimer } from "./TimerContext";

interface Employee {
  id: string;
  name: string;
}

interface ProjectDetailDialogProps {
  project: Project;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

interface TimerState {
  isRunning: boolean;
  startTime: Date | null;
  elapsedSeconds: number;
  selectedEmployee: string;
}

export const ProjectDetailDialog = ({ project, open, onClose, onRefresh }: ProjectDetailDialogProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projectHours, setProjectHours] = useState<ProjectHour[]>([]);
  const [filteredHours, setFilteredHours] = useState<ProjectHour[]>([]);
  const [loading, setLoading] = useState(false);
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [editingProjectName, setEditingProjectName] = useState(false);
  const [projectName, setProjectName] = useState(project.name);
  const [editingHourEntry, setEditingHourEntry] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState({
    hours_worked: "",
    description: "",
    date_worked: ""
  });

  // Report filters
  const [reportFilters, setReportFilters] = useState({
    startDate: "",
    endDate: "",
    employeeId: ""
  });

  // Single hour entry
  const [singleHourForm, setSingleHourForm] = useState({
    employee_id: "",
    date_worked: format(new Date(), "yyyy-MM-dd"),
    hours_worked: "",
    description: ""
  });

  // Period entry
  const [periodForm, setPeriodForm] = useState({
    employee_id: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
    hours_type: "per_day", // "per_day" or "total_period"
    hours_value: "",
    description: ""
  });

  // Timer context
  const { timer: globalTimer, startTimer: startGlobalTimer } = useTimer();

  // Local timer employee selection
  const [selectedTimerEmployee, setSelectedTimerEmployee] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchProjectHours();
      setProjectName(project.name);
    }
  }, [open, project.id, project.name]);

  // Listen for timer stopped events to refresh data
  useEffect(() => {
    const handleTimerStopped = (event: CustomEvent) => {
      if (event.detail?.projectId === project.id) {
        fetchProjectHours();
      }
    };

    window.addEventListener('timerStopped', handleTimerStopped as EventListener);
    return () => {
      window.removeEventListener('timerStopped', handleTimerStopped as EventListener);
    };
  }, [project.id]);

  // Filter hours based on report filters
  useEffect(() => {
    let filtered = [...projectHours];

    if (reportFilters.startDate) {
      filtered = filtered.filter(hour => hour.date_worked >= reportFilters.startDate);
    }

    if (reportFilters.endDate) {
      filtered = filtered.filter(hour => hour.date_worked <= reportFilters.endDate);
    }

    if (reportFilters.employeeId) {
      filtered = filtered.filter(hour => hour.employee_id === reportFilters.employeeId);
    }

    setFilteredHours(filtered);
  }, [projectHours, reportFilters]);


  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os funcionários.",
        variant: "destructive",
      });
    }
  };

  const fetchProjectHours = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_hours')
        .select(`
          *,
          employees (
            id,
            name
          )
        `)
        .eq('project_id', project.id)
        .order('date_worked', { ascending: false });

      if (error) throw error;
      setProjectHours(data || []);
    } catch (error) {
      console.error('Error fetching project hours:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as horas do projeto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSingleHourSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!singleHourForm.employee_id || !singleHourForm.hours_worked) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione um funcionário e informe as horas.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('project_hours')
        .insert([{
          project_id: project.id,
          employee_id: singleHourForm.employee_id,
          date_worked: singleHourForm.date_worked,
          hours_worked: parseFloat(singleHourForm.hours_worked),
          description: singleHourForm.description
        }]);

      if (error) throw error;

      toast({
        title: "Horas adicionadas",
        description: "As horas foram registradas com sucesso.",
      });

      setSingleHourForm({
        employee_id: "",
        date_worked: format(new Date(), "yyyy-MM-dd"),
        hours_worked: "",
        description: ""
      });

      fetchProjectHours();
    } catch (error) {
      console.error('Error adding hours:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar as horas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!periodForm.employee_id || !periodForm.hours_value) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione um funcionário e informe as horas.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Generate all dates in the period
      const startDate = parseISO(periodForm.start_date);
      const endDate = parseISO(periodForm.end_date);
      const dates = eachDayOfInterval({ start: startDate, end: endDate });

      let entries: any[] = [];

      if (periodForm.hours_type === "per_day") {
        // Hours per day - create entry for each day with the specified hours
        entries = dates.map(date => ({
          project_id: project.id,
          employee_id: periodForm.employee_id,
          date_worked: format(date, 'yyyy-MM-dd'),
          hours_worked: parseFloat(periodForm.hours_value),
          description: periodForm.description
        }));
      } else {
        // Total hours for the period - distribute equally across days
        const totalHours = parseFloat(periodForm.hours_value);
        const hoursPerDay = totalHours / dates.length;

        entries = dates.map(date => ({
          project_id: project.id,
          employee_id: periodForm.employee_id,
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
        employee_id: "",
        start_date: format(new Date(), "yyyy-MM-dd"),
        end_date: format(new Date(), "yyyy-MM-dd"),
        hours_type: "per_day",
        hours_value: "",
        description: ""
      });

      fetchProjectHours();
    } catch (error) {
      console.error('Error adding period hours:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar as horas do período.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimer = () => {
    if (!selectedTimerEmployee) {
      toast({
        title: "Funcionário obrigatório",
        description: "Selecione um funcionário para iniciar o timer.",
        variant: "destructive",
      });
      return;
    }

    const employee = employees.find(e => e.id === selectedTimerEmployee);
    if (!employee) return;

    startGlobalTimer(project.id, project.name, selectedTimerEmployee, employee.name);
  };


  const saveProjectName = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do projeto é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('projetos')
        .update({ name: projectName.trim() })
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: "Nome atualizado",
        description: "O nome do projeto foi atualizado com sucesso.",
      });

      setEditingProjectName(false);
      onRefresh();
    } catch (error) {
      console.error('Error updating project name:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o nome do projeto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelEditProjectName = () => {
    setProjectName(project.name);
    setEditingProjectName(false);
  };

  const deleteHourEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('project_hours')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Entrada removida",
        description: "A entrada de horas foi removida com sucesso.",
      });

      fetchProjectHours();
    } catch (error) {
      console.error('Error deleting hour entry:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a entrada.",
        variant: "destructive",
      });
    }
  };

  const startEditingHourEntry = (entry: ProjectHour) => {
    setEditingHourEntry(entry.id);
    setEditingForm({
      hours_worked: entry.hours_worked.toString(),
      description: entry.description || "",
      date_worked: entry.date_worked
    });
  };

  const cancelEditingHourEntry = () => {
    setEditingHourEntry(null);
    setEditingForm({
      hours_worked: "",
      description: "",
      date_worked: ""
    });
  };

  const saveHourEntry = async (id: string) => {
    if (!editingForm.hours_worked) {
      toast({
        title: "Horas obrigatórias",
        description: "Por favor, informe o número de horas trabalhadas.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('project_hours')
        .update({
          hours_worked: parseFloat(editingForm.hours_worked),
          description: editingForm.description,
          date_worked: editingForm.date_worked
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Entrada atualizada",
        description: "A entrada de horas foi atualizada com sucesso.",
      });

      setEditingHourEntry(null);
      fetchProjectHours();
    } catch (error) {
      console.error('Error updating hour entry:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a entrada.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async () => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o projeto "${project.name}"? Esta ação não pode ser desfeita e todas as horas registradas neste projeto também serão excluídas.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      // First delete all project hours
      const { error: hoursError } = await supabase
        .from('project_hours')
        .delete()
        .eq('project_id', project.id);

      if (hoursError) throw hoursError;

      // Then delete the project
      const { error: projectError } = await supabase
        .from('projetos')
        .delete()
        .eq('id', project.id);

      if (projectError) throw projectError;

      toast({
        title: "Projeto excluído",
        description: "O projeto foi excluído com sucesso.",
      });

      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o projeto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPublicLink = () => {
    const publicUrl = `${window.location.origin}/projects`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      toast({
        title: "Link copiado",
        description: "O link público dos projetos foi copiado para a área de transferência.",
      });
    }).catch(() => {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    });
  };

  const exportReport = () => {
    if (filteredHours.length === 0) {
      toast({
        title: "Nenhum dado",
        description: "Não há horas para exportar com os filtros aplicados.",
        variant: "destructive",
      });
      return;
    }

    if (hourlyRate <= 0) {
      toast({
        title: "Valor por hora obrigatório",
        description: "Por favor, informe o valor por hora para calcular os custos.",
        variant: "destructive",
      });
      return;
    }

    // Group hours by employee
    const employeeHours = filteredHours.reduce((acc, entry) => {
      const empId = entry.employee_id;
      if (!acc[empId]) {
        acc[empId] = {
          name: entry.employees?.name || 'Funcionário',
          totalHours: 0,
          entries: []
        };
      }
      acc[empId].totalHours += entry.hours_worked;
      acc[empId].entries.push(entry);
      return acc;
    }, {} as any);

    const totalHours = filteredHours.reduce((sum, entry) => sum + entry.hours_worked, 0);
    const totalCost = totalHours * hourlyRate;

    const employeesHTML = Object.values(employeeHours).map((emp: any) => {
      const empCost = emp.totalHours * hourlyRate;
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${emp.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${emp.totalHours.toFixed(2)}h</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${empCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    }).join('');

    // Generate detailed activities section
    const activitiesHTML = Object.values(employeeHours).map((emp: any) => {
      const entriesHTML = emp.entries
        .sort((a: any, b: any) => new Date(a.date_worked).getTime() - new Date(b.date_worked).getTime())
        .map((entry: any) => {
          const cost = entry.hours_worked * hourlyRate;
          return `
            <tr>
              <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: center;">
                ${format(parseISO(entry.date_worked), 'dd/MM/yyyy', { locale: ptBR })}
              </td>
              <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: center;">
                ${entry.hours_worked}h
              </td>
              <td style="padding: 6px; border-bottom: 1px solid #eee;">
                ${entry.description || '<em>Sem descrição</em>'}
              </td>
              <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right;">
                R$ ${cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          `;
        }).join('');

      return `
        <div style="margin-bottom: 25px;">
          <h4 style="margin: 15px 0 10px 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
            ${emp.name} - ${emp.totalHours.toFixed(2)}h (R$ ${(emp.totalHours * hourlyRate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
          </h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center; width: 15%;">Data</th>
                <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center; width: 15%;">Horas</th>
                <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left; width: 50%;">Descrição da Atividade</th>
                <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; width: 20%;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${entriesHTML}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório do Projeto - ${project.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="margin: 0; color: #333;">Relatório do Projeto</h1>
          <h2 style="margin: 10px 0; color: #666;">${project.name}</h2>
          ${project.clients ? `<p style="margin: 5px 0; color: #666;">Cliente: ${project.clients.name}</p>` : ''}
          <p style="margin: 5px 0; color: #666;">
            Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0;">Resumo</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
            <div>
              <div style="font-size: 24px; font-weight: bold; color: #333;">${totalHours.toFixed(2)}h</div>
              <div style="color: #666;">Total de Horas</div>
            </div>
            <div>
              <div style="font-size: 24px; font-weight: bold; color: #333;">R$ ${hourlyRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div style="color: #666;">Valor por Hora</div>
            </div>
            <div>
              <div style="font-size: 24px; font-weight: bold; color: #28a745;">R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div style="color: #666;">Custo Total</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h2>Resumo por Funcionário</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: left;">Funcionário</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: center;">Horas</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Custo</th>
              </tr>
            </thead>
            <tbody>
              ${employeesHTML}
            </tbody>
          </table>
        </div>

        <div style="margin-bottom: 30px;">
          <h2>Detalhamento das Atividades</h2>
          ${activitiesHTML}
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
          <p>FlowCode Financial - Sistema de Gestão de Projetos</p>
          <p>Relatório gerado automaticamente com descrição completa das atividades realizadas</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-projeto-${project.name.replace(/[^a-zA-Z0-9]/g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Relatório exportado",
      description: "O relatório foi baixado com sucesso.",
    });
  };

  const totalHours = filteredHours.reduce((sum, entry) => sum + entry.hours_worked, 0);
  const totalCost = totalHours * hourlyRate;

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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingProjectName(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyPublicLink}
                className="flex items-center gap-2"
              >
                <Link className="h-4 w-4" />
                Link Projetos Públicos
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteProject}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir Projeto
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="hours" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hours">Horas</TabsTrigger>
            <TabsTrigger value="period">Período</TabsTrigger>
            <TabsTrigger value="report">Relatório</TabsTrigger>
          </TabsList>

          <TabsContent value="hours" className="space-y-4">
            {/* Timer Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Timer de Trabalho</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartTimer}
                    disabled={globalTimer.isRunning || !selectedTimerEmployee}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {globalTimer.isRunning ? "Timer Ativo" : "Iniciar Timer"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="timer-employee">Funcionário para Timer</Label>
                  <Select
                    value={selectedTimerEmployee}
                    onValueChange={setSelectedTimerEmployee}
                    disabled={globalTimer.isRunning}
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

                  {globalTimer.isRunning && globalTimer.projectId === project.id && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Timer ativo para {globalTimer.employeeName}</strong>
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        O timer está rodando globalmente. Use o modal no canto superior direito para controlar.
                      </p>
                    </div>
                  )}

                  {globalTimer.isRunning && globalTimer.projectId !== project.id && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Timer ativo em outro projeto</strong>
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Finalize o timer atual em "{globalTimer.projectName}" antes de iniciar um novo.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Adicionar Horas</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSingleHourSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee">Funcionário *</Label>
                      <Select
                        value={singleHourForm.employee_id}
                        onValueChange={(value) => setSingleHourForm({ ...singleHourForm, employee_id: value })}
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

                    <div className="space-y-2">
                      <Label htmlFor="date">Data *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={singleHourForm.date_worked}
                        onChange={(e) => setSingleHourForm({ ...singleHourForm, date_worked: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hours">Horas Trabalhadas *</Label>
                      <Input
                        id="hours"
                        type="number"
                        step="0.5"
                        min="0"
                        value={singleHourForm.hours_worked}
                        onChange={(e) => setSingleHourForm({ ...singleHourForm, hours_worked: e.target.value })}
                        placeholder="Ex: 8.5"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Input
                        id="description"
                        value={singleHourForm.description}
                        onChange={(e) => setSingleHourForm({ ...singleHourForm, description: e.target.value })}
                        placeholder="Descrição do trabalho"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    {loading ? "Adicionando..." : "Adicionar Horas"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Hours List */}
            <Card>
              <CardHeader>
                <CardTitle>Horas Registradas</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : projectHours.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhuma hora registrada ainda
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projectHours.map((entry) => (
                      <div key={entry.id} className="p-3 border rounded-lg">
                        {editingHourEntry === entry.id ? (
                          // Edit mode
                          <div className="space-y-3">
                            <div className="font-medium text-sm text-muted-foreground">
                              Editando: {entry.employees?.name}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label htmlFor={`edit-date-${entry.id}`} className="text-xs">Data</Label>
                                <Input
                                  id={`edit-date-${entry.id}`}
                                  type="date"
                                  value={editingForm.date_worked}
                                  onChange={(e) => setEditingForm({ ...editingForm, date_worked: e.target.value })}
                                  className="text-sm"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label htmlFor={`edit-hours-${entry.id}`} className="text-xs">Horas</Label>
                                <Input
                                  id={`edit-hours-${entry.id}`}
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max="24"
                                  value={editingForm.hours_worked}
                                  onChange={(e) => setEditingForm({ ...editingForm, hours_worked: e.target.value })}
                                  className="text-sm"
                                  placeholder="Ex: 8.5"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label htmlFor={`edit-description-${entry.id}`} className="text-xs">Descrição</Label>
                                <Input
                                  id={`edit-description-${entry.id}`}
                                  value={editingForm.description}
                                  onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                                  className="text-sm"
                                  placeholder="Descrição do trabalho..."
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditingHourEntry}
                                className="flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => saveHourEntry(entry.id)}
                                className="flex items-center gap-1"
                              >
                                <Check className="h-3 w-3" />
                                Salvar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div className="flex justify-between items-start">
                            <div className="flex-1 space-y-1">
                              <div className="font-medium">{entry.employees?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                📅 {format(parseISO(entry.date_worked), 'dd/MM/yyyy', { locale: ptBR })} • ⏱️ {entry.hours_worked}h
                              </div>
                              {entry.description && (
                                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                  📝 {entry.description}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1 ml-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditingHourEntry(entry)}
                                className="h-8 w-8 p-0"
                                title="Editar entrada"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteHourEntry(entry.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                title="Excluir entrada"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="period" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Horas por Período</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePeriodSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="period-employee">Funcionário *</Label>
                    <Select
                      value={periodForm.employee_id}
                      onValueChange={(value) => setPeriodForm({ ...periodForm, employee_id: value })}
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

                  <Button type="submit" disabled={loading}>
                    <Calendar className="h-4 w-4 mr-2" />
                    {loading ? "Adicionando..." : "Adicionar Período"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="report" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Filtros do Relatório</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="report-start-date">Data Inicial</Label>
                    <Input
                      id="report-start-date"
                      type="date"
                      value={reportFilters.startDate}
                      onChange={(e) => setReportFilters({ ...reportFilters, startDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="report-end-date">Data Final</Label>
                    <Input
                      id="report-end-date"
                      type="date"
                      value={reportFilters.endDate}
                      onChange={(e) => setReportFilters({ ...reportFilters, endDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="report-employee">Funcionário</Label>
                    <Select
                      value={reportFilters.employeeId}
                      onValueChange={(value) => setReportFilters({ ...reportFilters, employeeId: value === "all" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os funcionários" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os funcionários</SelectItem>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setReportFilters({ startDate: "", endDate: "", employeeId: "" })}
                  >
                    Limpar Filtros
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">
                    {filteredHours.length} de {projectHours.length} registros
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações do Relatório</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hourly-rate">Valor por Hora (R$)</Label>
                  <Input
                    id="hourly-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>

                {totalHours > 0 && (
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totalHours.toFixed(2)}h</div>
                      <div className="text-sm text-muted-foreground">Total de Horas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">R$ {hourlyRate.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Valor por Hora</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">R$ {totalCost.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Custo Total</div>
                    </div>
                  </div>
                )}

                <Button onClick={exportReport} disabled={totalHours === 0 || hourlyRate <= 0} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Relatório
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};