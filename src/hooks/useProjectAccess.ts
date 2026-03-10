import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ProjectAccess, NewProjectAccess } from '@/types/project';

export const useProjectAccess = (projectId?: number) => {
  const [accesses, setAccesses] = useState<ProjectAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAccesses = useCallback(async () => {
    if (!projectId) {
      setAccesses([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_access')
        .select(`
          *,
          user:profiles!project_access_user_id_fkey(id, full_name, email),
          employee:employees!project_access_employee_id_fkey(id, name, email),
          created_by_user:profiles!project_access_created_by_fkey(id, full_name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAccesses((data || []) as ProjectAccess[]);
    } catch (error) {
      console.error('Error fetching project accesses:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os acessos.",
        variant: "destructive",
      });
      setAccesses([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    fetchAccesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const createAccess = async (access: NewProjectAccess): Promise<ProjectAccess | null> => {
    try {
      const { data, error } = await supabase
        .from('project_access')
        .insert(access)
        .select(`
          *,
          user:profiles!project_access_user_id_fkey(id, full_name, email),
          employee:employees!project_access_employee_id_fkey(id, name, email)
        `)
        .single();

      if (error) throw error;

      await fetchAccesses();
      toast({
        title: "Sucesso",
        description: "Acesso adicionado com sucesso.",
      });

      return data as ProjectAccess;
    } catch (error) {
      console.error('Error creating access:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o acesso.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateAccess = async (id: string, updates: Partial<ProjectAccess>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('project_access')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchAccesses();
      toast({
        title: "Sucesso",
        description: "Acesso atualizado com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Error updating access:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o acesso.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteAccess = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('project_access')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchAccesses();
      toast({
        title: "Sucesso",
        description: "Acesso removido com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting access:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o acesso.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    accesses,
    loading,
    fetchAccesses,
    createAccess,
    updateAccess,
    deleteAccess
  };
};




