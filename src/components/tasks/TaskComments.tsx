import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ProjectTask, TaskComment, NewTaskComment } from "@/types/task";
import { useAuth } from "@/components/auth/AuthContext";

interface TaskCommentsProps {
  task: ProjectTask;
  onAddComment: (comment: NewTaskComment) => Promise<void>;
}

export function TaskComments({ task, onAddComment }: TaskCommentsProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    try {
      await onAddComment({
        task_id: task.id,
        content: content.trim(),
        is_public: isPublic,
      });
      setContent("");
      setIsPublic(false);
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSaving(false);
    }
  };

  const comments = task.comments || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comentários ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário de novo comentário */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Digite seu comentário..."
            rows={3}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="commentPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="commentPublic" className="cursor-pointer text-sm">
                Comentário público
              </Label>
            </div>
            <Button type="submit" disabled={saving || !content.trim()} size="sm">
              <Send className="h-4 w-4 mr-2" />
              {saving ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </form>

        {/* Lista de comentários */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum comentário ainda
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="border-l-2 border-primary pl-4 py-2 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {comment.created_by_user?.full_name || "Usuário"}
                    </span>
                    {comment.is_public && (
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">
                        Público
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}




