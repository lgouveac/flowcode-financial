import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ProjectTask, TaskStatus, TaskComment, TaskAttachment, NewProjectTask, NewTaskStatus, NewTaskComment, NewTaskAttachment } from '@/types/task';

export const useTasks = (projectId?: number) => {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_tasks')
        .select(`
          *,
          status:task_statuses(*),
          project:projetos(id, name),
          assigned_employee:employees!project_tasks_assigned_to_fkey(id, name),
          created_by_user:profiles!project_tasks_created_by_fkey(id, full_name)
        `)
        .eq('project_id', projectId)
        .order('position', { ascending: true });

      if (error) throw error;

      // Buscar comentários separadamente
      const taskIds = (data || []).map(t => t.id);
      if (taskIds.length > 0) {
        const { data: commentsData } = await supabase
          .from('task_comments')
          .select(`
            *,
            created_by_user:profiles!task_comments_created_by_fkey(id, full_name)
          `)
          .in('task_id', taskIds)
          .order('created_at', { ascending: true });

        // Agrupar comentários por tarefa
        const tasksWithComments = (data || []).map(task => ({
          ...task,
          comments: (commentsData || []).filter(c => c.task_id === task.id)
        }));

        setTasks(tasksWithComments as ProjectTask[]);
      } else {
        setTasks((data || []) as ProjectTask[]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
      // Toast será mostrado apenas se necessário, sem causar re-renders
    } finally {
      setLoading(false);
    }
  }, [projectId]); // Removido toast das dependências para evitar loops

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); // Apenas projectId como dependência para evitar loops

  const createTask = async (task: NewProjectTask): Promise<ProjectTask | null> => {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .insert(task)
        .select(`
          *,
          status:task_statuses(*),
          project:projetos(id, name),
          assigned_employee:employees!project_tasks_assigned_to_fkey(id, name)
        `)
        .single();

      if (error) throw error;

      await fetchTasks();
      toast({
        title: "Sucesso",
        description: "Tarefa criada com sucesso.",
      });

      return data as ProjectTask;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a tarefa.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTask = async (id: string, updates: Partial<ProjectTask>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchTasks();
      toast({
        title: "Sucesso",
        description: "Tarefa atualizada com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a tarefa.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchTasks();
      toast({
        title: "Sucesso",
        description: "Tarefa deletada com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar a tarefa.",
        variant: "destructive",
      });
      return false;
    }
  };

  const moveTask = async (taskId: string, newStatusId: string, newPosition: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({
          status_id: newStatusId,
          position: newPosition
        })
        .eq('id', taskId);

      if (error) throw error;

      await fetchTasks();
      return true;
    } catch (error) {
      console.error('Error moving task:', error);
      toast({
        title: "Erro",
        description: "Não foi possível mover a tarefa.",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleTaskPublic = async (taskId: string, isPublic: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({ is_public: isPublic })
        .eq('id', taskId);

      if (error) throw error;

      await fetchTasks();
      toast({
        title: "Sucesso",
        description: isPublic ? "Tarefa marcada como pública." : "Tarefa marcada como privada.",
      });

      return true;
    } catch (error) {
      console.error('Error toggling task public:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a visibilidade da tarefa.",
        variant: "destructive",
      });
      return false;
    }
  };

  const addComment = async (comment: NewTaskComment): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('task_comments')
        .insert(comment);

      if (error) throw error;

      await fetchTasks();
      toast({
        title: "Sucesso",
        description: "Comentário adicionado com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o comentário.",
        variant: "destructive",
      });
      return false;
    }
  };

  const uploadAttachment = async (
    file: File,
    taskId: string,
    commentId?: string
  ): Promise<TaskAttachment | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(fileName);

      const fileType = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : 'file';

      const { data, error } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          comment_id: commentId || null,
          file_url: urlData.publicUrl,
          file_type: fileType,
          file_name: file.name,
          file_size: file.size,
        })
        .select()
        .single();

      if (error) throw error;

      return data as TaskAttachment;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o arquivo.",
        variant: "destructive",
      });
      return null;
    }
  };

  const fetchAttachments = async (taskId: string): Promise<TaskAttachment[]> => {
    try {
      const { data, error } = await supabase
        .from('task_attachments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as TaskAttachment[];
    } catch (error) {
      console.error('Error fetching attachments:', error);
      return [];
    }
  };

  return {
    tasks,
    loading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    toggleTaskPublic,
    addComment,
    uploadAttachment,
    fetchAttachments,
  };
};

