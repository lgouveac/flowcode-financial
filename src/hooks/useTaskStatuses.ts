import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { TaskStatus, NewTaskStatus } from '@/types/task';

export const useTaskStatuses = (projectId?: number) => {
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStatuses = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar todos os status e filtrar no cliente (mais confiável)
      const { data, error } = await supabase
        .from('task_statuses')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;

      // Filtrar no lado do cliente
      let filteredStatuses = (data || []) as TaskStatus[];
      
      if (projectId) {
        // Status globais (project_id é null) OU do projeto específico
        filteredStatuses = filteredStatuses.filter(
          s => s.project_id === null || s.project_id === projectId
        );
      } else {
        // Apenas status globais
        filteredStatuses = filteredStatuses.filter(s => s.project_id === null);
      }
      
      setStatuses(filteredStatuses);
    } catch (error) {
      console.error('Error fetching statuses:', error);
      setStatuses([]); // Definir array vazio em caso de erro para evitar loops
      toast({
        title: "Erro",
        description: "Não foi possível carregar os status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    fetchStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); // Apenas projectId como dependência para evitar loops

  const createStatus = async (status: NewTaskStatus): Promise<TaskStatus | null> => {
    try {
      // Se não tem project_id, define como NULL para status global
      const statusData = {
        ...status,
        project_id: status.project_id || null
      };

      const { data, error } = await supabase
        .from('task_statuses')
        .insert(statusData)
        .select()
        .single();

      if (error) throw error;

      await fetchStatuses();
      toast({
        title: "Sucesso",
        description: "Status criado com sucesso.",
      });

      return data as TaskStatus;
    } catch (error) {
      console.error('Error creating status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o status.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateStatus = async (id: string, updates: Partial<TaskStatus>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('task_statuses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchStatuses();
      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteStatus = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('task_statuses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchStatuses();
      toast({
        title: "Sucesso",
        description: "Status deletado com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o status. Status padrão não podem ser deletados.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    statuses,
    loading,
    fetchStatuses,
    createStatus,
    updateStatus,
    deleteStatus
  };
};

