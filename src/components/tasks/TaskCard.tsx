import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  User,
  MessageSquare,
  Globe,
  Copy,
  MoreVertical,
  Edit,
  Trash2,
  Bug,
  ListTodo,
  Link,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ProjectTask } from "@/types/task";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface TaskCardProps {
  task: ProjectTask;
  onEdit: (task: ProjectTask) => void;
  onDelete: (task: ProjectTask) => void;
  onTogglePublic: (task: ProjectTask) => void;
  onCopyPublicLink: (task: ProjectTask) => void;
}

export function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onTogglePublic,
  onCopyPublicLink 
}: TaskCardProps) {
  const { toast } = useToast();

  const priorityColors = {
    low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  const handleCopyLink = () => {
    if (task.is_public && task.public_token) {
      const link = `${window.location.origin}/public-task/${task.public_token}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Link copiado!",
        description: "Link público copiado para a área de transferência.",
      });
    } else {
      onCopyPublicLink(task);
    }
  };

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-sm leading-tight">{task.name}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTogglePublic(task)}>
                <Globe className="mr-2 h-4 w-4" />
                {task.is_public ? "Tornar Privada" : "Tornar Pública"}
              </DropdownMenuItem>
              {task.is_public && (
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Link Público
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(task)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {task.description && (
          <div 
            className="text-xs text-muted-foreground mb-2 line-clamp-2"
            dangerouslySetInnerHTML={{ 
              __html: task.description.length > 100 
                ? task.description.substring(0, 100) + '...' 
                : task.description 
            }}
          />
        )}
        
        <div className="flex flex-wrap gap-1 items-center text-xs">
          {task.task_type && (
            <Badge
              variant="outline"
              className={
                task.task_type === "bug"
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
              }
            >
              {task.task_type === "bug" ? (
                <><Bug className="h-3 w-3 mr-1" />Bug</>
              ) : (
                <><ListTodo className="h-3 w-3 mr-1" />Backlog</>
              )}
            </Badge>
          )}

          {task.priority && (
            <Badge
              variant="outline"
              className={priorityColors[task.priority]}
            >
              {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
            </Badge>
          )}
          
          {task.due_date && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(task.due_date), "dd/MM", { locale: ptBR })}</span>
            </div>
          )}
          
          {task.assigned_employee && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{task.assigned_employee.name}</span>
            </div>
          )}
          
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>{task.comments.length}</span>
            </div>
          )}
          
          {task.reported_by_name && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{task.reported_by_name}</span>
            </div>
          )}

          {task.reported_view && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>{task.reported_view}</span>
            </div>
          )}

          {task.is_public && (
            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              <Globe className="h-3 w-3 mr-1" />
              Pública
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}




