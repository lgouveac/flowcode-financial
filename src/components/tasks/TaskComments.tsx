import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, User, Image, Video, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ProjectTask, TaskComment, TaskAttachment, NewTaskComment } from "@/types/task";
import { useAuth } from "@/components/auth/AuthContext";
import { FileUpload } from "./FileUpload";
import { supabase } from "@/integrations/supabase/client";

interface TaskCommentsProps {
  task: ProjectTask;
  onAddComment: (comment: NewTaskComment) => Promise<void>;
}

export function TaskComments({ task, onAddComment }: TaskCommentsProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);

  useEffect(() => {
    fetchAttachments();
  }, [task.id]);

  const fetchAttachments = async () => {
    const { data } = await supabase
      .from("task_attachments")
      .select("*")
      .eq("task_id", task.id)
      .order("created_at", { ascending: true });
    setAttachments((data || []) as TaskAttachment[]);
  };

  const uploadFiles = async (commentId?: string) => {
    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${task.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("task-attachments")
        .upload(fileName, file);

      if (uploadError) continue;

      const { data: urlData } = supabase.storage
        .from("task-attachments")
        .getPublicUrl(fileName);

      const fileType = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : "file";

      await supabase.from("task_attachments").insert({
        task_id: task.id,
        comment_id: commentId || null,
        file_url: urlData.publicUrl,
        file_type: fileType,
        file_name: file.name,
        file_size: file.size,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;

    setSaving(true);
    try {
      if (content.trim()) {
        await onAddComment({
          task_id: task.id,
          content: content.trim(),
          is_public: isPublic,
        });
      }

      if (files.length > 0) {
        await uploadFiles();
        await fetchAttachments();
      }

      setContent("");
      setIsPublic(false);
      setFiles([]);
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
          <FileUpload files={files} onFilesChange={setFiles} maxFiles={3} />
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
            <Button type="submit" disabled={saving || (!content.trim() && files.length === 0)} size="sm">
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
                {/* Attachments linked to this comment */}
                {attachments
                  .filter((a) => a.comment_id === comment.id)
                  .map((att) => (
                    <AttachmentPreview key={att.id} attachment={att} />
                  ))}
              </div>
            ))
          )}
        </div>

        {/* Task-level attachments (no comment) */}
        {attachments.filter((a) => !a.comment_id).length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Anexos ({attachments.filter((a) => !a.comment_id).length})
            </p>
            <div className="flex flex-wrap gap-2">
              {attachments
                .filter((a) => !a.comment_id)
                .map((att) => (
                  <AttachmentPreview key={att.id} attachment={att} />
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AttachmentPreview({ attachment }: { attachment: TaskAttachment }) {
  if (attachment.file_type === "image") {
    return (
      <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
        <img
          src={attachment.file_url}
          alt={attachment.file_name}
          className="max-h-40 rounded border object-cover hover:opacity-80 transition-opacity"
        />
      </a>
    );
  }

  if (attachment.file_type === "video") {
    return (
      <video
        src={attachment.file_url}
        controls
        className="max-h-48 rounded border"
      />
    );
  }

  return (
    <a
      href={attachment.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-primary underline"
    >
      <Paperclip className="h-3 w-3" />
      {attachment.file_name}
    </a>
  );
}




