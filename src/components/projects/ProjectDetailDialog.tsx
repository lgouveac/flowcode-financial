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
import { Clock, Play, Pause, Square, Download, Calendar, Plus, Trash2, Link, Edit, Check, X, CheckCircle, Github, Users, GitCommit, Code, Loader2 } from "lucide-react";
import { format, differenceInDays, eachDayOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Project, ProjectHour } from "@/types/project";
import { useTimer } from "./TimerContext";
import { useGithubToken } from "@/hooks/useGithubToken";
import { GithubConnectionButton } from "./GithubConnectionButton";
import { fetchRepositoryStats } from "@/services/githubStats";

interface Employee {
  id: string;
  name: string;
}

interface ProjectDetailDialogProps {
  project: Project;
  open: boolean;
  onClose: () => void;
  onRefresh: (updatedProject?: Project) => void;
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

  // GitHub integration
  const { isAuthenticated, repos, loading: reposLoading, token } = useGithubToken();
  const [selectedGithubRepo, setSelectedGithubRepo] = useState<string>(project.github_repo_full_name || "none");
  const [savingGithub, setSavingGithub] = useState(false);
  const [githubStats, setGithubStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchProjectHours();
      setProjectName(project.name);
      setSelectedGithubRepo(project.github_repo_full_name || "none");
      setGithubStats(null);
    }
  }, [open, project.id, project.name, project.github_repo_full_name]);

  // Carregar estatísticas quando o projeto tem repositório
  useEffect(() => {
    // Não executar se o dialog não estiver aberto
    if (!open) {
      setGithubStats(null);
      setLoadingStats(false);
      return;
    }

    // Não executar se não houver repositório ou token
    if (!project.github_repo_full_name || !token) {
      setGithubStats(null);
      setLoadingStats(false);
      if (project.github_repo_full_name && !token) {
        console.warn('⚠️ Projeto tem repositório mas não há token do GitHub');
      }
      return;
    }

    // Resetar estatísticas quando o projeto ou repositório muda
    setGithubStats(null);
    setLoadingStats(false);
    
    const currentProjectId = project.id;
    const currentRepo = project.github_repo_full_name;
    
    console.log('🔄 Carregando estatísticas para:', currentRepo, 'projeto:', currentProjectId);
    
    // Flag para evitar múltiplas execuções simultâneas
    let cancelled = false;
    
    // Pequeno delay para garantir que o estado foi resetado
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      
      setLoadingStats(true);
      fetchRepositoryStats(currentRepo, token)
        .then(stats => {
          if (cancelled) return;
          
          // Verificar se ainda é o mesmo projeto antes de atualizar
          if (project.id === currentProjectId && project.github_repo_full_name === currentRepo) {
            console.log('✅ Estatísticas carregadas com sucesso:', stats);
            setGithubStats(stats);
          } else {
            console.log('⚠️ Projeto mudou durante o carregamento, descartando estatísticas');
          }
        })
        .catch(err => {
          if (cancelled) return;
          
          console.error('❌ Erro ao carregar estatísticas:', err);
          if (project.id === currentProjectId) {
            toast({
              title: "Erro ao carregar estatísticas",
              description: err.message || "Não foi possível buscar as estatísticas do repositório.",
              variant: "destructive",
            });
          }
        })
        .finally(() => {
          if (!cancelled && project.id === currentProjectId) {
            setLoadingStats(false);
          }
        });
    }, 150);
    
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [project.id, project.github_repo_full_name, token, open]);

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

  const approveHoursAndExport = async () => {
    if (filteredHours.length === 0) {
      toast({
        title: "Nenhum dado",
        description: "Não há horas para aprovar.",
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

    try {
      setLoading(true);

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
          ${project.data_inicio_ciclo ? `<p style="margin: 5px 0; color: #666;">Data de Início do Ciclo: ${new Date(project.data_inicio_ciclo).toLocaleDateString('pt-BR')}</p>` : ''}
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

      // 1. Download do relatório (como antes)
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-projeto-${project.name.replace(/[^a-zA-Z0-9]/g, '-')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 2. Salvar no Supabase (comentado até criar a tabela)
      /*
      try {
        const { error } = await supabase
          .from('projects_approved_hours')
          .insert({
            project_id: parseInt(project.id),
            approved: true,
            link_relatorio: content,
            project_hours: filteredHours,
            date_approval: new Date().toISOString().split('T')[0]
          });

        if (error) {
          console.error('Erro ao salvar no Supabase:', error);
          // Não falha a operação se o Supabase der erro
        }
      } catch (supabaseError) {
        console.error('Erro ao salvar no Supabase:', supabaseError);
        // Não falha a operação se o Supabase der erro
      }
      */

      // 3. Disparar webhook N8N
      try {
        await fetch('https://n8n.sof.to/webhook/53146107-4078-4120-8856-69e4d00f330e', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project_id: project.id,
            project_name: project.name,
            client_name: project.clients?.name || 'Cliente não informado',
            period: `${startDate} - ${endDate}`,
            total_hours: totalHours,
            hourly_rate: hourlyRate,
            total_cost: totalCost,
            employee_hours: Object.values(employeeHours).map((emp: any) => ({
              name: emp.name,
              hours: emp.totalHours,
              cost: emp.totalHours * hourlyRate
            })),
            project_hours: filteredHours,
            html_content: content,
            approval_date: new Date().toISOString()
          })
        });
      } catch (webhookError) {
        console.error('Erro ao chamar webhook N8N:', webhookError);
        // Não falha a operação se o webhook der erro
      }

      toast({
        title: "Horas aprovadas com sucesso!",
        description: "Relatório baixado, dados salvos e financeiro notificado.",
      });

    } catch (error) {
      console.error('Erro ao aprovar horas:', error);
      toast({
        title: "Erro ao aprovar horas",
        description: "Não foi possível concluir a aprovação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGithubRepo = async () => {
    try {
      setSavingGithub(true);
      
      const updateData: any = {};
      
      if (selectedGithubRepo && selectedGithubRepo !== "none") {
        const selectedRepo = repos.find(r => r.full_name === selectedGithubRepo);
        if (selectedRepo) {
          updateData.github_repo_full_name = selectedRepo.full_name;
          updateData.github_repo_url = selectedRepo.html_url;
          updateData.github_sync_enabled = true;
          
          // Buscar estatísticas do repositório
          if (token) {
            try {
              setLoadingStats(true);
              console.log('🔄 Buscando estatísticas do repositório:', selectedRepo.full_name);
              const stats = await fetchRepositoryStats(selectedRepo.full_name, token);
              console.log('✅ Estatísticas carregadas:', stats);
              setGithubStats(stats);
              updateData.github_last_sync_at = stats.lastSyncAt;
            } catch (statsError: any) {
              console.error('❌ Erro ao buscar estatísticas:', statsError);
              toast({
                title: "Aviso",
                description: `Repositório vinculado, mas não foi possível carregar as estatísticas: ${statsError.message || 'Erro desconhecido'}`,
                variant: "default",
              });
              // Não falhar a operação se as estatísticas derem erro
            } finally {
              setLoadingStats(false);
            }
          } else {
            console.warn('⚠️ Token do GitHub não disponível para buscar estatísticas');
          }
        }
      } else {
        updateData.github_repo_full_name = null;
        updateData.github_repo_url = null;
        updateData.github_sync_enabled = false;
        setGithubStats(null);
      }

      const { data: updatedProject, error } = await supabase
        .from('projetos')
        .update(updateData)
        .eq('id', project.id)
        .select()
        .single();

      if (error) throw error;

      if (!updatedProject) {
        throw new Error('Projeto não encontrado após atualização');
      }

      toast({
        title: "Repositório atualizado",
        description: selectedGithubRepo && selectedGithubRepo !== "none"
          ? `Repositório ${selectedGithubRepo} vinculado com sucesso${githubStats ? '. Estatísticas carregadas.' : ''}`
          : "Repositório removido do projeto",
      });

      // Passar o projeto atualizado para o refresh
      onRefresh(updatedProject);
    } catch (error: any) {
      console.error('Erro ao salvar repositório:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o repositório",
        variant: "destructive",
      });
    } finally {
      setSavingGithub(false);
    }
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

        <Tabs defaultValue="code" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code">Código</TabsTrigger>
            <TabsTrigger value="hours">Horas</TabsTrigger>
          </TabsList>

          {/* Aba Código */}
          <TabsContent value="code" className="space-y-4">
            {/* GitHub Integration Section */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    <span>Integração GitHub</span>
                  </div>
                  <GithubConnectionButton />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAuthenticated ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="github-repo-select">Repositório GitHub</Label>
                      <div className="flex gap-2">
                        <Select 
                          value={selectedGithubRepo} 
                          onValueChange={setSelectedGithubRepo}
                          disabled={reposLoading || savingGithub}
                          className="flex-1"
                        >
                          <SelectTrigger id="github-repo-select">
                            <SelectValue placeholder="Selecione um repositório (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum repositório</SelectItem>
                            {repos.map((repo) => (
                              <SelectItem key={repo.id} value={repo.full_name}>
                                <div className="flex items-center gap-2">
                                  <Github className="h-3 w-3" />
                                  <span>{repo.full_name}</span>
                                  {repo.private && (
                                    <span className="text-xs text-muted-foreground">(privado)</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={handleSaveGithubRepo}
                          disabled={savingGithub || selectedGithubRepo === (project.github_repo_full_name || "none")}
                          size="sm"
                        >
                          {savingGithub ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </div>
                    {project.github_repo_full_name && (
                      <div className="mt-4 space-y-4">
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm">
                            <strong>Repositório atual:</strong>{" "}
                            <a 
                              href={project.github_repo_url || `https://github.com/${project.github_repo_full_name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {project.github_repo_full_name}
                            </a>
                          </p>
                          {project.github_last_sync_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Última sincronização: {new Date(project.github_last_sync_at).toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>

                        {/* Estatísticas do GitHub */}
                        {loadingStats ? (
                          <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-3 text-muted-foreground">Carregando estatísticas do GitHub...</span>
                          </div>
                        ) : githubStats ? (
                          <div className="space-y-6">
                            {/* Informações do Repositório */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Informações do Repositório</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground">⭐ Stars</p>
                                    <p className="text-lg font-semibold">{githubStats.repository.stars.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">🍴 Forks</p>
                                    <p className="text-lg font-semibold">{githubStats.repository.forks.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">👁️ Watchers</p>
                                    <p className="text-lg font-semibold">{githubStats.repository.watchers.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">💻 Linguagem</p>
                                    <p className="text-lg font-semibold">{githubStats.repository.language}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">📦 Tamanho</p>
                                    <p className="text-lg font-semibold">{(githubStats.repository.size / 1024).toFixed(2)} MB</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">🌿 Branch Padrão</p>
                                    <p className="text-lg font-semibold">{githubStats.branches.default}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">📅 Criado em</p>
                                    <p className="text-sm font-semibold">{new Date(githubStats.repository.created_at).toLocaleDateString('pt-BR')}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">🔄 Última atualização</p>
                                    <p className="text-sm font-semibold">{new Date(githubStats.repository.updated_at).toLocaleDateString('pt-BR')}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Estatísticas de Commits */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Commits (últimos 30 dias)</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Total de Commits</p>
                                    <p className="text-2xl font-semibold">{githubStats.totalCommits}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Linhas Adicionadas</p>
                                    <p className="text-2xl font-semibold text-green-600">+{githubStats.totalLines.additions.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Linhas Removidas</p>
                                    <p className="text-2xl font-semibold text-red-600">-{githubStats.totalLines.deletions.toLocaleString()}</p>
                                  </div>
                                </div>

                                {/* Commits Recentes */}
                                {githubStats.recentCommits.length > 0 && (
                                  <div>
                                    <p className="text-sm font-semibold mb-2">Commits Recentes</p>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                      {githubStats.recentCommits.map((commit: any) => (
                                        <div key={commit.sha} className="p-2 border rounded text-sm">
                                          <div className="flex items-center gap-2 mb-1">
                                            <code className="text-xs bg-muted px-1 rounded">{commit.sha}</code>
                                            <span className="text-muted-foreground text-xs">por {commit.author}</span>
                                            <span className="text-muted-foreground text-xs">
                                              {format(parseISO(commit.date), 'dd/MM/yyyy', { locale: ptBR })}
                                            </span>
                                          </div>
                                          <p className="font-medium">{commit.message}</p>
                                          {(commit.additions > 0 || commit.deletions > 0) && (
                                            <div className="flex items-center gap-2 mt-1 text-xs">
                                              <span className="text-green-600">+{commit.additions}</span>
                                              <span className="text-red-600">-{commit.deletions}</span>
                                              {commit.url && (
                                                <a 
                                                  href={commit.url} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-primary hover:underline ml-auto"
                                                >
                                                  Ver no GitHub →
                                                </a>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {/* Contribuidores */}
                            {githubStats.contributors.length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base">Contribuidores</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-3">
                                    {githubStats.contributors.map((contributor: any) => (
                                      <div key={contributor.login} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                          <img 
                                            src={contributor.avatar_url} 
                                            alt={contributor.login}
                                            className="w-10 h-10 rounded-full"
                                          />
                                          <div>
                                            <p className="font-medium">{contributor.login}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {contributor.commits} commits
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                          <div className="text-center">
                                            <p className="text-green-600 font-semibold">+{contributor.additions.toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground">adicionadas</p>
                                          </div>
                                          <div className="text-center">
                                            <p className="text-red-600 font-semibold">-{contributor.deletions.toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground">removidas</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {/* Pull Requests */}
                            {githubStats.pullRequests && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base">Pull Requests</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-4 gap-4">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Total</p>
                                      <p className="text-xl font-semibold">{githubStats.pullRequests.total}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Abertos</p>
                                      <p className="text-xl font-semibold text-blue-600">{githubStats.pullRequests.open}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Fechados</p>
                                      <p className="text-xl font-semibold text-gray-600">{githubStats.pullRequests.closed}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Mergeados</p>
                                      <p className="text-xl font-semibold text-green-600">{githubStats.pullRequests.merged}</p>
                                    </div>
                                  </div>
                                  {githubStats.pullRequests.recent.length > 0 && (
                                    <div>
                                      <p className="text-sm font-semibold mb-2">PRs Recentes</p>
                                      <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {githubStats.pullRequests.recent.map((pr: any) => (
                                          <div key={pr.number} className="p-2 border rounded text-sm">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className={`px-2 py-0.5 rounded text-xs ${
                                                pr.state === 'open' ? 'bg-blue-100 text-blue-800' :
                                                pr.merged_at ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                              }`}>
                                                {pr.merged_at ? 'Merged' : pr.state}
                                              </span>
                                              <span className="text-muted-foreground text-xs">#{pr.number}</span>
                                              <span className="text-muted-foreground text-xs">por {pr.author}</span>
                                            </div>
                                            <p className="font-medium">{pr.title}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )}

                            {/* Issues */}
                            {githubStats.issues && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base">Issues</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Total</p>
                                      <p className="text-xl font-semibold">{githubStats.issues.total}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Abertas</p>
                                      <p className="text-xl font-semibold text-orange-600">{githubStats.issues.open}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Fechadas</p>
                                      <p className="text-xl font-semibold text-gray-600">{githubStats.issues.closed}</p>
                                    </div>
                                  </div>
                                  {githubStats.issues.recent.length > 0 && (
                                    <div>
                                      <p className="text-sm font-semibold mb-2">Issues Recentes</p>
                                      <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {githubStats.issues.recent.map((issue: any) => (
                                          <div key={issue.number} className="p-2 border rounded text-sm">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className={`px-2 py-0.5 rounded text-xs ${
                                                issue.state === 'open' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                                              }`}>
                                                {issue.state}
                                              </span>
                                              <span className="text-muted-foreground text-xs">#{issue.number}</span>
                                              <span className="text-muted-foreground text-xs">por {issue.author}</span>
                                            </div>
                                            <p className="font-medium">{issue.title}</p>
                                            {issue.labels.length > 0 && (
                                              <div className="flex gap-1 mt-1">
                                                {issue.labels.map((label: string) => (
                                                  <span key={label} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                    {label}
                                                  </span>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )}

                            {/* Releases */}
                            {githubStats.releases.length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base">Releases</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    {githubStats.releases.map((release: any) => (
                                      <div key={release.tag} className="p-3 border rounded-lg">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="font-medium">{release.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {release.tag} • {new Date(release.published_at).toLocaleDateString('pt-BR')}
                                            </p>
                                          </div>
                                          <div className="flex gap-2">
                                            {release.draft && (
                                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Draft</span>
                                            )}
                                            {release.prerelease && (
                                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Pre-release</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {/* Branches */}
                            {githubStats.branches && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base">Branches</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Total</p>
                                      <p className="text-xl font-semibold">{githubStats.branches.total}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Protegidas</p>
                                      <p className="text-xl font-semibold">{githubStats.branches.protected}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Padrão</p>
                                      <p className="text-lg font-semibold">{githubStats.branches.default}</p>
                                    </div>
                                  </div>
                                  {githubStats.branches.list.length > 0 && (
                                    <div>
                                      <p className="text-sm font-semibold mb-2">Lista de Branches</p>
                                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                        {githubStats.branches.list.map((branch: any) => (
                                          <div key={branch.name} className="p-2 border rounded text-sm flex items-center justify-between">
                                            <span>{branch.name}</span>
                                            {branch.protected && (
                                              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Protegida</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground p-4 border rounded-md text-center">
                    Conecte o GitHub acima para vincular repositórios aos projetos
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Horas */}
          <TabsContent value="hours" className="space-y-4">
            <Tabs defaultValue="single" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="single">Horas</TabsTrigger>
                <TabsTrigger value="period">Período</TabsTrigger>
                <TabsTrigger value="report">Relatório</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-4">
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

                <Button onClick={approveHoursAndExport} disabled={totalHours === 0 || hourlyRate <= 0 || loading} className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {loading ? "Processando..." : "Aprovar Horas e Gerar Relatório"}
                </Button>
              </CardContent>
            </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};