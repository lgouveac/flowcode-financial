import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Play, Plus, Trash2, Calendar, Edit, Check, X, CheckCircle, Download } from "lucide-react";
import { format, differenceInDays, eachDayOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Project, ProjectHour } from "@/types/project";
import { useTimer } from "./TimerContext";

interface Employee {
  id: string;
  name: string;
}

interface ProjectHoursTabProps {
  project: Project;
  onRefresh: (updatedProject?: Project) => void;
}

function convertToDecimalHours(hours: string, minutes: string): number {
  const h = parseFloat(hours) || 0;
  const m = parseFloat(minutes) || 0;
  return h + (m / 60);
}

function convertDecimalToHoursMinutes(decimal: number): { hours: number; minutes: number } {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return { hours, minutes };
}

export function ProjectHoursTab({ project, onRefresh }: ProjectHoursTabProps) {
  const { toast } = useToast();
  const { timer: globalTimer, startTimer: startGlobalTimer } = useTimer();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projectHours, setProjectHours] = useState<ProjectHour[]>([]);
  const [filteredHours, setFilteredHours] = useState<ProjectHour[]>([]);
  const [loading, setLoading] = useState(false);
  const [hourlyRate, setHourlyRate] = useState<number>(0);

  const [editingHourEntry, setEditingHourEntry] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState({
    hours: "", minutes: "", description: "", date_worked: ""
  });

  const [reportFilters, setReportFilters] = useState({
    startDate: "", endDate: "", employeeId: ""
  });

  const [singleHourForm, setSingleHourForm] = useState({
    employee_id: "",
    date_worked: format(new Date(), "yyyy-MM-dd"),
    hours: "", minutes: "", description: ""
  });

  const [periodForm, setPeriodForm] = useState({
    employee_id: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
    hours_type: "per_day" as "per_day" | "total_period",
    hours: "", minutes: "", description: ""
  });

  const [selectedTimerEmployee, setSelectedTimerEmployee] = useState("");

  useEffect(() => {
    fetchEmployees();
    fetchProjectHours();
  }, [project.id]);

  useEffect(() => {
    const handleTimerStopped = (event: CustomEvent) => {
      if (event.detail?.projectId === project.id) {
        fetchProjectHours();
      }
    };
    window.addEventListener('timerStopped', handleTimerStopped as EventListener);
    return () => window.removeEventListener('timerStopped', handleTimerStopped as EventListener);
  }, [project.id]);

  useEffect(() => {
    let filtered = [...projectHours];
    if (reportFilters.startDate) filtered = filtered.filter(h => h.date_worked >= reportFilters.startDate);
    if (reportFilters.endDate) filtered = filtered.filter(h => h.date_worked <= reportFilters.endDate);
    if (reportFilters.employeeId) filtered = filtered.filter(h => h.employee_id === reportFilters.employeeId);
    setFilteredHours(filtered);
  }, [projectHours, reportFilters]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase.from('employees').select('id, name').order('name');
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar os funcionários.", variant: "destructive" });
    }
  };

  const fetchProjectHours = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_hours')
        .select(`*, employees (id, name)`)
        .eq('project_id', project.id)
        .order('date_worked', { ascending: false });
      if (error) throw error;
      setProjectHours(data || []);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar as horas do projeto.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSingleHourSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleHourForm.employee_id || (!singleHourForm.hours && !singleHourForm.minutes)) {
      toast({ title: "Campos obrigatórios", description: "Selecione um funcionário e informe as horas.", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const hoursWorked = convertToDecimalHours(singleHourForm.hours, singleHourForm.minutes);
      const { error } = await supabase.from('project_hours').insert([{
        project_id: project.id, employee_id: singleHourForm.employee_id,
        date_worked: singleHourForm.date_worked, hours_worked: hoursWorked,
        description: singleHourForm.description
      }]);
      if (error) throw error;
      toast({ title: "Horas adicionadas", description: "As horas foram registradas com sucesso." });
      setSingleHourForm({ employee_id: "", date_worked: format(new Date(), "yyyy-MM-dd"), hours: "", minutes: "", description: "" });
      fetchProjectHours();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível adicionar as horas.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodForm.employee_id || (!periodForm.hours && !periodForm.minutes)) {
      toast({ title: "Campos obrigatórios", description: "Selecione um funcionário e informe as horas.", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const startDate = parseISO(periodForm.start_date);
      const endDate = parseISO(periodForm.end_date);
      const dates = eachDayOfInterval({ start: startDate, end: endDate });
      let entries: { project_id: string; employee_id: string; date_worked: string; hours_worked: number; description: string }[] = [];

      if (periodForm.hours_type === "per_day") {
        const hoursPerDay = convertToDecimalHours(periodForm.hours, periodForm.minutes);
        entries = dates.map(date => ({
          project_id: project.id, employee_id: periodForm.employee_id,
          date_worked: format(date, 'yyyy-MM-dd'), hours_worked: hoursPerDay, description: periodForm.description
        }));
      } else {
        const totalHours = convertToDecimalHours(periodForm.hours, periodForm.minutes);
        const hoursPerDay = totalHours / dates.length;
        entries = dates.map(date => ({
          project_id: project.id, employee_id: periodForm.employee_id,
          date_worked: format(date, 'yyyy-MM-dd'), hours_worked: hoursPerDay,
          description: `${periodForm.description} (${totalHours.toFixed(2)}h distribuídas em ${dates.length} dias)`
        }));
      }

      const { error } = await supabase.from('project_hours').insert(entries);
      if (error) throw error;
      const totalHours = entries.reduce((sum, e) => sum + e.hours_worked, 0);
      toast({ title: "Horas adicionadas", description: `${entries.length} entradas registradas (${totalHours.toFixed(2)}h total).` });
      setPeriodForm({ employee_id: "", start_date: format(new Date(), "yyyy-MM-dd"), end_date: format(new Date(), "yyyy-MM-dd"), hours_type: "per_day", hours: "", minutes: "", description: "" });
      fetchProjectHours();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível adicionar as horas do período.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimer = () => {
    if (!selectedTimerEmployee) {
      toast({ title: "Funcionário obrigatório", description: "Selecione um funcionário para iniciar o timer.", variant: "destructive" });
      return;
    }
    const employee = employees.find(e => e.id === selectedTimerEmployee);
    if (!employee) return;
    startGlobalTimer(project.id, project.name, selectedTimerEmployee, employee.name);
  };

  const deleteHourEntry = async (id: string) => {
    try {
      const { error } = await supabase.from('project_hours').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Entrada removida", description: "A entrada de horas foi removida com sucesso." });
      fetchProjectHours();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível remover a entrada.", variant: "destructive" });
    }
  };

  const startEditingHourEntry = (entry: ProjectHour) => {
    setEditingHourEntry(entry.id);
    const { hours, minutes } = convertDecimalToHoursMinutes(entry.hours_worked);
    setEditingForm({ hours: hours.toString(), minutes: minutes.toString(), description: entry.description || "", date_worked: entry.date_worked });
  };

  const cancelEditingHourEntry = () => {
    setEditingHourEntry(null);
    setEditingForm({ hours: "", minutes: "", description: "", date_worked: "" });
  };

  const saveHourEntry = async (id: string) => {
    if (!editingForm.hours && !editingForm.minutes) {
      toast({ title: "Horas obrigatórias", description: "Informe o número de horas.", variant: "destructive" });
      return;
    }
    try {
      const hoursWorked = convertToDecimalHours(editingForm.hours, editingForm.minutes);
      const { error } = await supabase.from('project_hours').update({
        hours_worked: hoursWorked, description: editingForm.description, date_worked: editingForm.date_worked
      }).eq('id', id);
      if (error) throw error;
      toast({ title: "Entrada atualizada", description: "A entrada de horas foi atualizada." });
      setEditingHourEntry(null);
      fetchProjectHours();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar a entrada.", variant: "destructive" });
    }
  };

  const approveHoursAndExport = async () => {
    if (filteredHours.length === 0) {
      toast({ title: "Nenhum dado", description: "Não há horas para aprovar.", variant: "destructive" });
      return;
    }
    if (hourlyRate <= 0) {
      toast({ title: "Valor por hora obrigatório", description: "Informe o valor por hora.", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const employeeHours = filteredHours.reduce((acc, entry) => {
        const empId = entry.employee_id;
        if (!acc[empId]) { acc[empId] = { name: entry.employees?.name || 'Funcionário', totalHours: 0, entries: [] }; }
        acc[empId].totalHours += entry.hours_worked;
        acc[empId].entries.push(entry);
        return acc;
      }, {} as Record<string, { name: string; totalHours: number; entries: ProjectHour[] }>);

      const totalHours = filteredHours.reduce((sum, e) => sum + e.hours_worked, 0);
      const totalCost = totalHours * hourlyRate;

      const employeesHTML = Object.values(employeeHours).map(emp => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${emp.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${emp.totalHours.toFixed(2)}h</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${(emp.totalHours * hourlyRate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join('');

      const activitiesHTML = Object.values(employeeHours).map(emp => {
        const entriesHTML = emp.entries
          .sort((a, b) => new Date(a.date_worked).getTime() - new Date(b.date_worked).getTime())
          .map(entry => `
            <tr>
              <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: center;">${format(parseISO(entry.date_worked), 'dd/MM/yyyy', { locale: ptBR })}</td>
              <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: center;">${entry.hours_worked}h</td>
              <td style="padding: 6px; border-bottom: 1px solid #eee;">${entry.description || '<em>Sem descrição</em>'}</td>
              <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right;">R$ ${(entry.hours_worked * hourlyRate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            </tr>
          `).join('');

        return `
          <div style="margin-bottom: 25px;">
            <h4 style="margin: 15px 0 10px 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
              ${emp.name} - ${emp.totalHours.toFixed(2)}h (R$ ${(emp.totalHours * hourlyRate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
            </h4>
            <table style="width: 100%; border-collapse: collapse;">
              <thead><tr style="background-color: #f8f9fa;">
                <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center; width: 15%;">Data</th>
                <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center; width: 15%;">Horas</th>
                <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left; width: 50%;">Descrição</th>
                <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; width: 20%;">Valor</th>
              </tr></thead>
              <tbody>${entriesHTML}</tbody>
            </table>
          </div>
        `;
      }).join('');

      const content = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório - ${project.name}</title>
        <style>body{font-family:Arial,sans-serif;margin:20px;color:#333}@media print{body{margin:0}}</style></head><body>
        <div style="text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:20px;">
          <h1 style="margin:0;">Relatório do Projeto</h1>
          <h2 style="margin:10px 0;color:#666;">${project.name}</h2>
          ${project.clients ? `<p style="margin:5px 0;color:#666;">Cliente: ${project.clients.name}</p>` : ''}
          <p style="margin:5px 0;color:#666;">Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
        </div>
        <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin-bottom:30px;">
          <h2 style="margin:0 0 15px 0;">Resumo</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;">
            <div><div style="font-size:24px;font-weight:bold;">${totalHours.toFixed(2)}h</div><div style="color:#666;">Total de Horas</div></div>
            <div><div style="font-size:24px;font-weight:bold;">R$ ${hourlyRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div><div style="color:#666;">Valor por Hora</div></div>
            <div><div style="font-size:24px;font-weight:bold;color:#28a745;">R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div><div style="color:#666;">Custo Total</div></div>
          </div>
        </div>
        <div style="margin-bottom:30px;"><h2>Resumo por Funcionário</h2>
          <table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8f9fa;">
            <th style="padding:10px;border-bottom:2px solid #ddd;text-align:left;">Funcionário</th>
            <th style="padding:10px;border-bottom:2px solid #ddd;text-align:center;">Horas</th>
            <th style="padding:10px;border-bottom:2px solid #ddd;text-align:right;">Custo</th>
          </tr></thead><tbody>${employeesHTML}</tbody></table>
        </div>
        <div style="margin-bottom:30px;"><h2>Detalhamento das Atividades</h2>${activitiesHTML}</div>
        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #ddd;text-align:center;color:#666;font-size:12px;">
          <p>FlowCode Financial - Sistema de Gestão de Projetos</p>
        </div></body></html>`;

      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-projeto-${project.name.replace(/[^a-zA-Z0-9]/g, '-')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      try {
        await fetch('https://n8n.sof.to/webhook/53146107-4078-4120-8856-69e4d00f330e', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: project.id, project_name: project.name,
            client_name: project.clients?.name || 'Cliente não informado',
            period: `${reportFilters.startDate} - ${reportFilters.endDate}`,
            total_hours: totalHours, hourly_rate: hourlyRate, total_cost: totalCost,
            employee_hours: Object.values(employeeHours).map(emp => ({ name: emp.name, hours: emp.totalHours, cost: emp.totalHours * hourlyRate })),
            project_hours: filteredHours, html_content: content, approval_date: new Date().toISOString()
          })
        });
      } catch (webhookError) {
        console.error('Erro ao chamar webhook N8N:', webhookError);
      }

      toast({ title: "Horas aprovadas com sucesso!", description: "Relatório baixado e financeiro notificado." });
    } catch (error) {
      toast({ title: "Erro ao aprovar horas", description: "Não foi possível concluir a aprovação.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const totalHours = filteredHours.reduce((sum, e) => sum + e.hours_worked, 0);
  const totalCost = totalHours * hourlyRate;

  return (
    <Tabs defaultValue="single" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="single">Horas</TabsTrigger>
        <TabsTrigger value="period">Período</TabsTrigger>
        <TabsTrigger value="report">Relatório</TabsTrigger>
      </TabsList>

      {/* Single Hours */}
      <TabsContent value="single" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Timer de Trabalho</span>
              <Button variant="outline" size="sm" onClick={handleStartTimer} disabled={globalTimer.isRunning || !selectedTimerEmployee}>
                <Play className="h-4 w-4 mr-2" />
                {globalTimer.isRunning ? "Timer Ativo" : "Iniciar Timer"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Funcionário para Timer</Label>
              <Select value={selectedTimerEmployee} onValueChange={setSelectedTimerEmployee} disabled={globalTimer.isRunning}>
                <SelectTrigger><SelectValue placeholder="Selecionar funcionário" /></SelectTrigger>
                <SelectContent>
                  {employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {globalTimer.isRunning && globalTimer.projectId === project.id && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800"><strong>Timer ativo para {globalTimer.employeeName}</strong></p>
                  <p className="text-xs text-green-600 mt-1">O timer está rodando globalmente.</p>
                </div>
              )}
              {globalTimer.isRunning && globalTimer.projectId !== project.id && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800"><strong>Timer ativo em outro projeto</strong></p>
                  <p className="text-xs text-yellow-600 mt-1">Finalize o timer atual em "{globalTimer.projectName}" antes de iniciar um novo.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Adicionar Horas</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSingleHourSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Funcionário *</Label>
                  <Select value={singleHourForm.employee_id} onValueChange={v => setSingleHourForm({ ...singleHourForm, employee_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar funcionário" /></SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input type="date" value={singleHourForm.date_worked} onChange={e => setSingleHourForm({ ...singleHourForm, date_worked: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horas *</Label>
                  <Input type="number" step="1" min="0" max="24" value={singleHourForm.hours} onChange={e => setSingleHourForm({ ...singleHourForm, hours: e.target.value })} placeholder="Ex: 1" required />
                  <p className="text-xs text-muted-foreground">Horas inteiras (0-24)</p>
                </div>
                <div className="space-y-2">
                  <Label>Minutos *</Label>
                  <Input type="number" step="1" min="0" max="59" value={singleHourForm.minutes} onChange={e => setSingleHourForm({ ...singleHourForm, minutes: e.target.value })} placeholder="Ex: 20" required />
                  <p className="text-xs text-muted-foreground">Minutos (0-59)</p>
                </div>
              </div>
              {(singleHourForm.hours || singleHourForm.minutes) && (
                <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                  Total: <strong>{convertToDecimalHours(singleHourForm.hours, singleHourForm.minutes).toFixed(2)}h</strong>
                  {singleHourForm.hours && singleHourForm.minutes && <span className="ml-2">({singleHourForm.hours}h {singleHourForm.minutes}min)</span>}
                </div>
              )}
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={singleHourForm.description} onChange={e => setSingleHourForm({ ...singleHourForm, description: e.target.value })} placeholder="Descrição do trabalho" />
              </div>
              <Button type="submit" disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />{loading ? "Adicionando..." : "Adicionar Horas"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Horas Registradas</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Carregando...</div>
            ) : projectHours.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">Nenhuma hora registrada ainda</div>
            ) : (
              <div className="space-y-2">
                {projectHours.map(entry => (
                  <div key={entry.id} className="p-3 border rounded-lg">
                    {editingHourEntry === entry.id ? (
                      <div className="space-y-3">
                        <div className="font-medium text-sm text-muted-foreground">Editando: {entry.employees?.name}</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Data</Label>
                            <Input type="date" value={editingForm.date_worked} onChange={e => setEditingForm({ ...editingForm, date_worked: e.target.value })} className="text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Horas</Label>
                            <Input type="number" step="1" min="0" max="24" value={editingForm.hours} onChange={e => setEditingForm({ ...editingForm, hours: e.target.value })} className="text-sm" placeholder="Ex: 1" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Minutos</Label>
                            <Input type="number" step="1" min="0" max="59" value={editingForm.minutes} onChange={e => setEditingForm({ ...editingForm, minutes: e.target.value })} className="text-sm" placeholder="Ex: 20" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Descrição</Label>
                            <Input value={editingForm.description} onChange={e => setEditingForm({ ...editingForm, description: e.target.value })} className="text-sm" placeholder="Descrição..." />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={cancelEditingHourEntry}><X className="h-3 w-3" /> Cancelar</Button>
                          <Button size="sm" onClick={() => saveHourEntry(entry.id)}><Check className="h-3 w-3" /> Salvar</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-1">
                          <div className="font-medium">{entry.employees?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(parseISO(entry.date_worked), 'dd/MM/yyyy', { locale: ptBR })} - {entry.hours_worked}h
                          </div>
                          {entry.description && <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{entry.description}</div>}
                        </div>
                        <div className="flex gap-1 ml-3">
                          <Button variant="ghost" size="sm" onClick={() => startEditingHourEntry(entry)} className="h-8 w-8 p-0"><Edit className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteHourEntry(entry.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700"><Trash2 className="h-3 w-3" /></Button>
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

      {/* Period */}
      <TabsContent value="period" className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Adicionar Horas por Período</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handlePeriodSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Funcionário *</Label>
                <Select value={periodForm.employee_id} onValueChange={v => setPeriodForm({ ...periodForm, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar funcionário" /></SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Inicial *</Label>
                  <Input type="date" value={periodForm.start_date} onChange={e => setPeriodForm({ ...periodForm, start_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Data Final *</Label>
                  <Input type="date" value={periodForm.end_date} onChange={e => setPeriodForm({ ...periodForm, end_date: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Entrada *</Label>
                <Select value={periodForm.hours_type} onValueChange={(v: "per_day" | "total_period") => setPeriodForm({ ...periodForm, hours_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_day">Horas por dia</SelectItem>
                    <SelectItem value="total_period">Total de horas do período</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{periodForm.hours_type === "per_day" ? "Horas por Dia *" : "Total de Horas *"}</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Horas</Label>
                    <Input type="number" step="1" min="0" max="24" value={periodForm.hours} onChange={e => setPeriodForm({ ...periodForm, hours: e.target.value })} placeholder="Ex: 1" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Minutos</Label>
                    <Input type="number" step="1" min="0" max="59" value={periodForm.minutes} onChange={e => setPeriodForm({ ...periodForm, minutes: e.target.value })} placeholder="Ex: 20" required />
                  </div>
                </div>
                {(periodForm.hours || periodForm.minutes) && (
                  <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                    Total: <strong>{convertToDecimalHours(periodForm.hours, periodForm.minutes).toFixed(2)}h</strong>
                    {periodForm.hours_type === "total_period" && periodForm.start_date && periodForm.end_date && (
                      <span className="ml-2 block mt-1">
                        Distribuído em {differenceInDays(parseISO(periodForm.end_date), parseISO(periodForm.start_date)) + 1} dias:
                        <strong> {(convertToDecimalHours(periodForm.hours, periodForm.minutes) / (differenceInDays(parseISO(periodForm.end_date), parseISO(periodForm.start_date)) + 1)).toFixed(2)}h/dia</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={periodForm.description} onChange={e => setPeriodForm({ ...periodForm, description: e.target.value })} placeholder="Descrição do trabalho" />
              </div>
              {periodForm.start_date && periodForm.end_date && (
                <div className="text-sm text-muted-foreground">
                  Total de dias: {differenceInDays(parseISO(periodForm.end_date), parseISO(periodForm.start_date)) + 1}
                  {(periodForm.hours || periodForm.minutes) && (
                    <span>
                      {periodForm.hours_type === "per_day" ? (
                        <> | Total: {((differenceInDays(parseISO(periodForm.end_date), parseISO(periodForm.start_date)) + 1) * convertToDecimalHours(periodForm.hours, periodForm.minutes)).toFixed(2)}h</>
                      ) : (
                        <> | {convertToDecimalHours(periodForm.hours, periodForm.minutes).toFixed(2)}h distribuídas ({(convertToDecimalHours(periodForm.hours, periodForm.minutes) / (differenceInDays(parseISO(periodForm.end_date), parseISO(periodForm.start_date)) + 1)).toFixed(2)}h/dia)</>
                      )}
                    </span>
                  )}
                </div>
              )}
              <Button type="submit" disabled={loading}>
                <Calendar className="h-4 w-4 mr-2" />{loading ? "Adicionando..." : "Adicionar Período"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Report */}
      <TabsContent value="report" className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Filtros do Relatório</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Input type="date" value={reportFilters.startDate} onChange={e => setReportFilters({ ...reportFilters, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input type="date" value={reportFilters.endDate} onChange={e => setReportFilters({ ...reportFilters, endDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Funcionário</Label>
                <Select value={reportFilters.employeeId} onValueChange={v => setReportFilters({ ...reportFilters, employeeId: v === "all" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Todos os funcionários" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os funcionários</SelectItem>
                    {employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setReportFilters({ startDate: "", endDate: "", employeeId: "" })}>Limpar Filtros</Button>
              <span className="text-sm text-muted-foreground self-center">{filteredHours.length} de {projectHours.length} registros</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Configurações do Relatório</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Valor por Hora (R$)</Label>
              <Input type="number" step="0.01" min="0" value={hourlyRate} onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)} placeholder="0,00" />
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
              <CheckCircle className="h-4 w-4 mr-2" />{loading ? "Processando..." : "Aprovar Horas e Gerar Relatório"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
