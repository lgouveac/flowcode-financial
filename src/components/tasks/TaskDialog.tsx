import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Bug, ListTodo, Link, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProjectTask, TaskStatus, TaskPriority, TaskType } from "@/types/task";

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: Partial<ProjectTask>) => Promise<void>;
  task?: ProjectTask | null;
  statuses: TaskStatus[];
  employees: Array<{ id: string; name: string }>;
  projectId: number;
  initialStatusId?: string;
}

export function TaskDialog({
  open,
  onClose,
  onSave,
  task,
  statuses,
  employees,
  projectId,
  initialStatusId,
}: TaskDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("none");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setName(task.name || "");
      setDescription(task.description || "");
      setStatusId(task.status_id || "");
      setAssignedTo(task.assigned_to || "none");
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setPriority(task.priority || "medium");
      setIsPublic(task.is_public || false);
    } else {
      setName("");
      setDescription("");
      setStatusId(initialStatusId || statuses[0]?.id || "");
      setAssignedTo("none");
      setDueDate(undefined);
      setPriority("medium");
      setIsPublic(false);
    }
  }, [task, statuses, open, initialStatusId]);

  const handleSave = async () => {
    if (!name.trim() || !statusId) {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        id: task?.id,
        name: name.trim(),
        description: description.trim() || undefined,
        project_id: projectId,
        status_id: statusId,
        assigned_to: assignedTo === "none" ? undefined : assignedTo,
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
        priority,
        is_public: isPublic,
      });
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Tarefa *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome da tarefa"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição (Rich Text)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Digite a descrição da tarefa (suporta HTML/Markdown)"
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use Markdown: **negrito**, *itálico*, # Título, - Lista
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select value={statusId} onValueChange={setStatusId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        {status.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assigned">Atribuído a</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Ninguém" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguém</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dueDate">Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dueDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? (
                      format(dueDate, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Report info (read-only when submitted by client) */}
          {task?.task_type && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium">
                {task.task_type === "bug" ? (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                    <Bug className="h-3 w-3 mr-1" />Bug
                  </Badge>
                ) : (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    <ListTodo className="h-3 w-3 mr-1" />Backlog
                  </Badge>
                )}
                <span className="text-muted-foreground">Reportado por cliente</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {task.reported_by_name && (
                  <div>
                    <span className="text-muted-foreground">Nome:</span>{" "}
                    {task.reported_by_name}
                  </div>
                )}
                {task.reported_by_email && (
                  <div>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {task.reported_by_email}
                  </div>
                )}
                {task.reported_url && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">URL:</span>{" "}
                    <a
                      href={task.reported_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      {task.reported_url}
                    </a>
                  </div>
                )}
                {task.reported_view && (
                  <div>
                    <span className="text-muted-foreground">Visão:</span>{" "}
                    {task.reported_view}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="isPublic" className="cursor-pointer">
              Tarefa pública (visível sem login)
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim() || !statusId}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

