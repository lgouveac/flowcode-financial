import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileText, Calendar, DollarSign, Clock, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Project, ProjectHourReport } from "@/types/project";

interface ProjectReportProps {
  projects: Project[];
}

interface ReportData {
  project_id: string;
  project_name: string;
  client_name?: string;
  total_hours: number;
  entries_count: number;
  employees: {
    employee_id: string;
    employee_name: string;
    hours: number;
  }[];
}

export const ProjectReport = ({ projects }: ProjectReportProps) => {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedProject || selectedMonth) {
      fetchReportData();
    }
  }, [selectedProject, selectedMonth]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Build query
      let query = supabase
        .from('project_hours')
        .select(`
          *,
          projetos (
            id,
            name,
            clients (
              name
            )
          ),
          employees (
            id,
            name
          )
        `);

      // Filter by project if selected
      if (selectedProject) {
        query = query.eq('project_id', selectedProject);
      }

      // Filter by month
      if (selectedMonth) {
        const startDate = `${selectedMonth}-01`;
        const endDate = `${selectedMonth}-31`;
        query = query.gte('date_worked', startDate).lte('date_worked', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process data
      const processedData = processReportData(data || []);
      setReportData(processedData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o relatório.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (data: any[]): ReportData[] => {
    const groupedByProject = data.reduce((acc, entry) => {
      const projectId = entry.project_id;

      if (!acc[projectId]) {
        acc[projectId] = {
          project_id: projectId,
          project_name: entry.projetos?.name || 'Projeto sem nome',
          client_name: entry.projetos?.clients?.name,
          total_hours: 0,
          entries_count: 0,
          employees: {}
        };
      }

      acc[projectId].total_hours += entry.hours_worked;
      acc[projectId].entries_count += 1;

      // Group by employee
      const employeeId = entry.employee_id;
      if (!acc[projectId].employees[employeeId]) {
        acc[projectId].employees[employeeId] = {
          employee_id: employeeId,
          employee_name: entry.employees?.name || 'Colaborador',
          hours: 0
        };
      }
      acc[projectId].employees[employeeId].hours += entry.hours_worked;

      return acc;
    }, {});

    // Convert to array and format employees
    return Object.values(groupedByProject).map((project: any) => ({
      ...project,
      employees: Object.values(project.employees)
    }));
  };

  const exportToPDF = () => {
    if (reportData.length === 0) {
      toast({
        title: "Nenhum dado",
        description: "Não há dados para exportar.",
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

    // Create PDF content
    const content = generatePDFContent();

    // Create and download
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-projetos-${selectedMonth || 'todos'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Relatório exportado",
      description: "O relatório foi baixado com sucesso.",
    });
  };

  const generatePDFContent = () => {
    const totalHours = reportData.reduce((sum, project) => sum + project.total_hours, 0);
    const totalCost = totalHours * hourlyRate;

    const projectsHTML = reportData.map(project => {
      const projectCost = project.total_hours * hourlyRate;
      const employeesHTML = project.employees.map(emp =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${emp.employee_name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${emp.hours}h</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">R$ ${(emp.hours * hourlyRate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        </tr>`
      ).join('');

      return `
        <div style="margin-bottom: 30px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd;">
            <h3 style="margin: 0; color: #333;">${project.project_name}</h3>
            ${project.client_name ? `<p style="margin: 5px 0 0 0; color: #666;">Cliente: ${project.client_name}</p>` : ''}
          </div>
          <div style="padding: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
              <div><strong>Total de Horas:</strong> ${project.total_hours}h</div>
              <div><strong>Custo Total:</strong> R$ ${projectCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: left;">Colaborador</th>
                  <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: center;">Horas</th>
                  <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Custo</th>
                </tr>
              </thead>
              <tbody>
                ${employeesHTML}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Projetos</title>
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
          <h1 style="margin: 0; color: #333;">Relatório de Projetos</h1>
          <p style="margin: 10px 0 0 0; color: #666;">
            ${selectedMonth ? `Período: ${format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: ptBR })}` : 'Todos os períodos'}
          </p>
          <p style="margin: 5px 0 0 0; color: #666;">
            Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0;">Resumo Geral</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
            <div>
              <div style="font-size: 24px; font-weight: bold; color: #333;">${totalHours}h</div>
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

        ${projectsHTML}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
          <p>FlowCode Financial - Sistema de Gestão de Projetos</p>
        </div>
      </body>
      </html>
    `;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalHours = reportData.reduce((sum, project) => sum + project.total_hours, 0);
  const totalCost = totalHours * hourlyRate;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Projeto</Label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os projetos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os projetos</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="month">Mês</Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Valor por Hora (R$)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {reportData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <Clock className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Horas</p>
                <p className="text-2xl font-bold">{totalHours}h</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <DollarSign className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor por Hora</p>
                <p className="text-2xl font-bold">{formatCurrency(hourlyRate)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <FileText className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Custo Total</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCost)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Button */}
      {reportData.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={exportToPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Relatório (PDF)
          </Button>
        </div>
      )}

      {/* Report Data */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reportData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum dado encontrado</h3>
            <p className="text-muted-foreground text-center">
              Não há horas lançadas para os filtros selecionados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reportData.map((project) => (
            <Card key={project.project_id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{project.project_name}</CardTitle>
                    {project.client_name && (
                      <p className="text-sm text-muted-foreground">Cliente: {project.client_name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Total: {project.total_hours}h</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(project.total_hours * hourlyRate)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.employees.map((employee) => (
                    <div key={employee.employee_id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="font-medium">{employee.employee_name}</span>
                      <div className="text-right">
                        <span className="text-sm text-muted-foreground">{employee.hours}h</span>
                        <span className="ml-4 font-medium">
                          {formatCurrency(employee.hours * hourlyRate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};