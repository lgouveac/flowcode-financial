import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/tasks/FileUpload";
import { Loader2, Bug, ListTodo, CheckCircle2, AlertCircle } from "lucide-react";
import type { TaskType, TaskStatus } from "@/types/task";

interface ProjectInfo {
  id: number;
  name: string;
}

export default function PublicTaskSubmit() {
  const { token } = useParams<{ token: string }>();

  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [taskType, setTaskType] = useState<TaskType>("bug");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [reportedUrl, setReportedUrl] = useState("");
  const [reportedView, setReportedView] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (token) fetchProject();
  }, [token]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projetos")
        .select("id, name, submit_token")
        .eq("submit_token", token)
        .single();

      if (error || !data) {
        setError("Projeto não encontrado ou link inválido.");
        return;
      }

      setProject({ id: data.id, name: data.name });

      // Fetch statuses for the project (project-specific + global)
      const { data: statusData, error: statusError } = await supabase
        .from("task_statuses")
        .select("*")
        .or(`project_id.eq.${data.id},project_id.is.null`)
        .order("position", { ascending: true });

      console.log("Statuses fetched:", statusData, "Error:", statusError);
      setStatuses((statusData || []) as TaskStatus[]);
    } catch (err) {
      console.error("Error fetching project:", err);
      setError("Erro ao carregar o projeto.");
    } finally {
      setLoading(false);
    }
  };

  const findStatusByType = (type: TaskType): string | null => {
    // Try to find a status matching the type name
    const typeNames = type === "bug"
      ? ["bug", "bugs", "erro", "erros"]
      : ["backlog", "a fazer", "to do", "todo", "pendente"];

    const match = statuses.find((s) =>
      typeNames.some((n) => s.name.toLowerCase().includes(n))
    );

    if (match) return match.id;

    // Fallback: use default or first status
    const defaultStatus = statuses.find((s) => s.is_default);
    return defaultStatus?.id || statuses[0]?.id || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!project || !name.trim()) return;

    const statusId = findStatusByType(taskType);
    if (!statusId) {
      setError("Nenhum status configurado para este projeto.");
      return;
    }

    try {
      setSubmitting(true);

      // Count existing tasks for position
      const { count } = await supabase
        .from("project_tasks")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id)
        .eq("status_id", statusId);

      // Create the task (is_public false to avoid trigger issues with public_token generation)
      const { data: taskData, error: taskError } = await supabase
        .from("project_tasks")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          project_id: project.id,
          status_id: statusId,
          position: (count || 0),
          is_public: false,
          task_type: taskType,
          reported_url: reportedUrl.trim() || null,
          reported_view: reportedView.trim() || null,
          reported_by_name: reporterName.trim() || null,
          reported_by_email: reporterEmail.trim() || null,
        })
        .select("id")
        .single();

      if (taskError) throw taskError;

      const taskId = taskData.id;

      // Upload attachments
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${taskId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("task-attachments")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("task-attachments")
          .getPublicUrl(fileName);

        const fileType = file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
          ? "video"
          : "file";

        await supabase.from("task_attachments").insert({
          task_id: taskId,
          file_url: urlData.publicUrl,
          file_type: fileType,
          file_name: file.name,
          file_size: file.size,
        });
      }

      // Add comment if provided
      if (comment.trim()) {
        await supabase.from("task_comments").insert({
          task_id: taskId,
          content: comment.trim(),
          is_public: true,
        });
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting task:", err);
      setError("Erro ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setReportedUrl("");
    setReportedView("");
    setComment("");
    setFiles([]);
    setTaskType("bug");
    setSubmitted(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-muted-foreground text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Enviado com sucesso!</h2>
            <p className="text-muted-foreground text-center mb-6">
              Sua {taskType === "bug" ? "reportagem de bug" : "solicitação"} foi
              registrada. Nossa equipe irá analisar em breve.
            </p>
            <Button onClick={resetForm} variant="outline">
              Enviar outro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">{project?.name}</h1>
          <p className="text-muted-foreground">
            Reporte um bug ou envie uma solicitação
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Tipo</CardTitle>
              <CardDescription>O que você gostaria de reportar?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTaskType("bug")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                    taskType === "bug"
                      ? "border-red-500 bg-red-500/10"
                      : "border-muted hover:border-red-500/50"
                  }`}
                >
                  <Bug
                    className={`h-6 w-6 ${
                      taskType === "bug" ? "text-red-500" : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      taskType === "bug" ? "text-red-500" : "text-muted-foreground"
                    }`}
                  >
                    Bug
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Algo não está funcionando
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTaskType("backlog")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                    taskType === "backlog"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-muted hover:border-blue-500/50"
                  }`}
                >
                  <ListTodo
                    className={`h-6 w-6 ${
                      taskType === "backlog"
                        ? "text-blue-500"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      taskType === "backlog"
                        ? "text-blue-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    Solicitação
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Sugestão ou melhoria
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Info do reporter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Seus dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reporter-name">Nome</Label>
                  <Input
                    id="reporter-name"
                    placeholder="Seu nome"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reporter-email">Email</Label>
                  <Input
                    id="reporter-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-name">
                  Título <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="task-name"
                  placeholder={
                    taskType === "bug"
                      ? "Ex: Botão de salvar não funciona na tela de perfil"
                      : "Ex: Adicionar filtro por data no relatório"
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-description">Descrição</Label>
                <Textarea
                  id="task-description"
                  placeholder={
                    taskType === "bug"
                      ? "Descreva o que aconteceu e o que deveria acontecer..."
                      : "Descreva o que gostaria e por que é importante..."
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reported-url">
                    URL onde encontrou o problema
                  </Label>
                  <Input
                    id="reported-url"
                    placeholder="https://app.exemplo.com/pagina"
                    value={reportedUrl}
                    onChange={(e) => setReportedUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reported-view">Visão / Perfil</Label>
                  <Select
                    value={reportedView}
                    onValueChange={setReportedView}
                  >
                    <SelectTrigger id="reported-view">
                      <SelectValue placeholder="Selecione a visão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anexos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Anexos</CardTitle>
              <CardDescription>
                Envie prints, vídeos ou arquivos que ajudem a entender o problema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload files={files} onFilesChange={setFiles} />
            </CardContent>
          </Card>

          {/* Comentário */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Comentário adicional</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Alguma observação extra..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={submitting || !name.trim()}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                {taskType === "bug" ? (
                  <Bug className="h-4 w-4 mr-2" />
                ) : (
                  <ListTodo className="h-4 w-4 mr-2" />
                )}
                Enviar {taskType === "bug" ? "Bug" : "Solicitação"}
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
