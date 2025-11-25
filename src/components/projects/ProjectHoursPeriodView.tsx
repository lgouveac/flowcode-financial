import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, DollarSign, User, TrendingUp, BarChart } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Project, ProjectHour } from "@/types/project";

interface Employee {
  id: string;
  name: string;
}

interface ProjectHoursPeriodViewProps {
  project: Project;
  open: boolean;
  onClose: () => void;
}

interface PeriodData {
  period: string;
  date: Date;
  hours: number;
  entries: number;
  employees: {
    id: string;
    name: string;
    hours: number;
  }[];
}

export const ProjectHoursPeriodView = ({ project, open, onClose }: ProjectHoursPeriodViewProps) => {
  const [projectHours, setProjectHours] = useState<ProjectHour[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [periodType, setPeriodType] = useState<"day" | "week" | "month" | "year">("month");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchProjectHours();
    }
  }, [open, project.id]);

  useEffect(() => {
    if (projectHours.length > 0) {
      fetchProjectHours();
    }
  }, [selectedEmployee, startDate, endDate]);

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
    }
  };

  const fetchProjectHours = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('project_hours')
        .select(`
          *,
          employees (
            id,
            name
          )
        `)
        .eq('project_id', project.id)
        .gte('date_worked', startDate)
        .lte('date_worked', endDate)
        .order('date_worked', { ascending: true });

      if (selectedEmployee !== "all") {
        query = query.eq('employee_id', selectedEmployee);
      }

      const { data, error } = await query;

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

  const periodData = useMemo(() => {
    if (projectHours.length === 0) return [];

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    let periods: Date[] = [];

    switch (periodType) {
      case "day":
        periods = eachDayOfInterval({ start: startDateObj, end: endDateObj });
        break;
      case "week":
        periods = eachWeekOfInterval({ start: startDateObj, end: endDateObj }, { weekStartsOn: 1 });
        break;
      case "month":
        periods = eachMonthOfInterval({ start: startDateObj, end: endDateObj });
        break;
      case "year":
        // For years, we'll create a simple array based on the year range
        const startYear = startDateObj.getFullYear();
        const endYear = endDateObj.getFullYear();
        periods = [];
        for (let year = startYear; year <= endYear; year++) {
          periods.push(new Date(year, 0, 1));
        }
        break;
    }

    const periodDataMap = new Map<string, PeriodData>();

    // Initialize periods
    periods.forEach(periodDate => {
      let periodKey: string;
      let periodLabel: string;

      switch (periodType) {
        case "day":
          periodKey = format(periodDate, "yyyy-MM-dd");
          periodLabel = format(periodDate, "dd/MM/yyyy", { locale: ptBR });
          break;
        case "week":
          periodKey = format(periodDate, "yyyy-'W'ww");
          const weekEnd = endOfWeek(periodDate, { weekStartsOn: 1 });
          periodLabel = `${format(periodDate, "dd/MM", { locale: ptBR })} - ${format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}`;
          break;
        case "month":
          periodKey = format(periodDate, "yyyy-MM");
          periodLabel = format(periodDate, "MMMM yyyy", { locale: ptBR });
          break;
        case "year":
          periodKey = format(periodDate, "yyyy");
          periodLabel = format(periodDate, "yyyy");
          break;
        default:
          periodKey = format(periodDate, "yyyy-MM-dd");
          periodLabel = format(periodDate, "dd/MM/yyyy", { locale: ptBR });
      }

      periodDataMap.set(periodKey, {
        period: periodLabel,
        date: periodDate,
        hours: 0,
        entries: 0,
        employees: []
      });
    });

    // Group hours by period
    projectHours.forEach(hour => {
      const hourDate = new Date(hour.date_worked);
      let periodKey: string;

      switch (periodType) {
        case "day":
          periodKey = format(hourDate, "yyyy-MM-dd");
          break;
        case "week":
          const weekStart = startOfWeek(hourDate, { weekStartsOn: 1 });
          periodKey = format(weekStart, "yyyy-'W'ww");
          break;
        case "month":
          periodKey = format(hourDate, "yyyy-MM");
          break;
        case "year":
          periodKey = format(hourDate, "yyyy");
          break;
        default:
          periodKey = format(hourDate, "yyyy-MM-dd");
      }

      const period = periodDataMap.get(periodKey);
      if (period) {
        period.hours += hour.hours_worked;
        period.entries += 1;

        // Add or update employee data
        const existingEmployee = period.employees.find(emp => emp.id === hour.employee_id);
        if (existingEmployee) {
          existingEmployee.hours += hour.hours_worked;
        } else {
          period.employees.push({
            id: hour.employee_id,
            name: hour.employees?.name || 'Funcionário',
            hours: hour.hours_worked
          });
        }
      }
    });

    return Array.from(periodDataMap.values()).filter(period => period.hours > 0);
  }, [projectHours, periodType, startDate, endDate]);

  const totalHours = periodData.reduce((sum, period) => sum + period.hours, 0);
  const totalCost = totalHours * hourlyRate;
  const avgHoursPerPeriod = periodData.length > 0 ? totalHours / periodData.length : 0;

  const handlePeriodTypeChange = (newType: "day" | "week" | "month" | "year") => {
    setPeriodType(newType);

    // Adjust date range based on period type
    const now = new Date();
    switch (newType) {
      case "day":
        setStartDate(format(startOfMonth(now), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
        break;
      case "week":
        setStartDate(format(startOfMonth(now), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
        break;
      case "month":
        setStartDate(format(startOfYear(now), "yyyy-MM-dd"));
        setEndDate(format(endOfYear(now), "yyyy-MM-dd"));
        break;
      case "year":
        const fiveYearsAgo = new Date(now.getFullYear() - 4, 0, 1);
        setStartDate(format(fiveYearsAgo, "yyyy-MM-dd"));
        setEndDate(format(endOfYear(now), "yyyy-MM-dd"));
        break;
    }
  };

  if (!open) return null;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Análise por Período - {project.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={periodType} onValueChange={handlePeriodTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Por Dia</SelectItem>
                  <SelectItem value="week">Por Semana</SelectItem>
                  <SelectItem value="month">Por Mês</SelectItem>
                  <SelectItem value="year">Por Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Funcionário</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Horas</p>
              <p className="text-2xl font-bold">{totalHours.toFixed(2)}h</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Média por {periodType === "day" ? "Dia" : periodType === "week" ? "Semana" : periodType === "month" ? "Mês" : "Ano"}</p>
              <p className="text-2xl font-bold">{avgHoursPerPeriod.toFixed(2)}h</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor por Hora</p>
              <p className="text-2xl font-bold">R$ {hourlyRate.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <DollarSign className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Custo Total</p>
              <p className="text-2xl font-bold text-green-600">R$ {totalCost.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Rate Input */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Valores</CardTitle>
        </CardHeader>
        <CardContent>
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
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Period Data */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : periodData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma hora encontrada</h3>
            <p className="text-muted-foreground text-center">
              Não há horas registradas para o período e filtros selecionados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {periodData.map((period, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{period.period}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {period.entries} {period.entries === 1 ? "entrada" : "entradas"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-mono font-bold text-lg">{period.hours.toFixed(2)}h</span>
                    </div>
                    {hourlyRate > 0 && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-green-600">
                          R$ {(period.hours * hourlyRate).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Funcionários
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {period.employees.map((employee) => (
                      <div key={employee.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="font-medium">{employee.name}</span>
                        <div className="text-right">
                          <Badge variant="secondary" className="font-mono">
                            {employee.hours.toFixed(2)}h
                          </Badge>
                          {hourlyRate > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              R$ {(employee.hours * hourlyRate).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
};