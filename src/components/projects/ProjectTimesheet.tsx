import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon, Clock, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Project, ProjectHour, NewProjectHour } from "@/types/project";

interface Employee {
  id: string;
  name: string;
}

interface ProjectTimesheetProps {
  projects: Project[];
  onRefresh: () => void;
}

export const ProjectTimesheet = ({ projects, onRefresh }: ProjectTimesheetProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeEntries, setTimeEntries] = useState<ProjectHour[]>([]);
  const [newEntry, setNewEntry] = useState({
    project_id: "",
    employee_id: "",
    date_worked: "",
    hours: "",
    minutes: "",
    description: "",
  });

  // Função auxiliar para converter horas + minutos em decimal
  const convertToDecimalHours = (hours: string, minutes: string): number => {
    const h = parseFloat(hours) || 0;
    const m = parseFloat(minutes) || 0;
    return h + (m / 60);
  };
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchTimeEntries();
  }, []);

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

  const fetchTimeEntries = async () => {
    try {
      setLoadingEntries(true);
      const { data, error } = await supabase
        .from('project_hours')
        .select(`
          *,
          projetos (
            id,
            name
          ),
          employees (
            id,
            name
          )
        `)
        .order('date_worked', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTimeEntries(data || []);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as horas lançadas.",
        variant: "destructive",
      });
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEntry.project_id || !newEntry.employee_id || !newEntry.date_worked || (!newEntry.hours && !newEntry.minutes)) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const hoursWorked = convertToDecimalHours(newEntry.hours, newEntry.minutes);

      const { error } = await supabase
        .from('project_hours')
        .insert([{
          project_id: newEntry.project_id,
          employee_id: newEntry.employee_id,
          date_worked: newEntry.date_worked,
          hours_worked: hoursWorked,
          description: newEntry.description
        }]);

      if (error) throw error;

      toast({
        title: "Horas lançadas",
        description: "As horas foram lançadas com sucesso.",
      });

      // Reset form
      setNewEntry({
        project_id: "",
        employee_id: "",
        date_worked: "",
        hours: "",
        minutes: "",
        description: "",
      });
      setSelectedDate(undefined);

      // Refresh data
      fetchTimeEntries();
      onRefresh();
    } catch (error: any) {
      console.error('Error adding time entry:', error);
      toast({
        title: "Erro ao lançar horas",
        description: error.message || "Ocorreu um erro ao lançar as horas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
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

      fetchTimeEntries();
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting time entry:', error);
      toast({
        title: "Erro ao remover",
        description: error.message || "Ocorreu um erro ao remover a entrada.",
        variant: "destructive",
      });
    }
  };

  const formatHours = (hours: number) => {
    return `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Form for new time entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Lançar Horas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project">Projeto *</Label>
                <Select
                  value={newEntry.project_id}
                  onValueChange={(value) => setNewEntry({ ...newEntry, project_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.filter(p => p.status === 'active').map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee">Colaborador *</Label>
                <Select
                  value={newEntry.employee_id}
                  onValueChange={(value) => setNewEntry({ ...newEntry, employee_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar colaborador" />
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
                <Label>Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        if (date) {
                          setNewEntry({ ...newEntry, date_worked: format(date, "yyyy-MM-dd") });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours">Horas *</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="1"
                    min="0"
                    max="24"
                    value={newEntry.hours}
                    onChange={(e) => setNewEntry({ ...newEntry, hours: e.target.value })}
                    placeholder="Ex: 1"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Horas inteiras (0-24)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minutes">Minutos *</Label>
                  <Input
                    id="minutes"
                    type="number"
                    step="1"
                    min="0"
                    max="59"
                    value={newEntry.minutes}
                    onChange={(e) => setNewEntry({ ...newEntry, minutes: e.target.value })}
                    placeholder="Ex: 20"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Minutos (0-59)
                  </p>
                </div>
              </div>

              {/* Mostrar total convertido */}
              {(newEntry.hours || newEntry.minutes) && (
                <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                  Total: <strong>{convertToDecimalHours(newEntry.hours, newEntry.minutes).toFixed(2)}h</strong>
                  {newEntry.hours && newEntry.minutes && (
                    <span className="ml-2">
                      ({newEntry.hours}h {newEntry.minutes}min)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                placeholder="Descreva o que foi feito..."
                rows={2}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Lançar Horas"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent time entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lançamentos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEntries ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
              ))}
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma hora lançada ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {entry.projetos?.name} - {entry.employees?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(entry.date_worked), "dd/MM/yyyy", { locale: ptBR })}
                      {entry.description && ` • ${entry.description}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">
                      {formatHours(entry.hours_worked)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};