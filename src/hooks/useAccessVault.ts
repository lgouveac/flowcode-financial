import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AccessVaultEntry, NewAccessVaultEntry } from "@/types/access-vault";

export const useAccessVault = (projectId?: number) => {
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [entries, setEntries] = useState<AccessVaultEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("access_vault")
        .select("*")
        .order("service_name", { ascending: true });

      if (projectId !== undefined) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;

      if (error) {
        toastRef.current({
          title: "Erro ao carregar acessos",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setEntries((data as AccessVaultEntry[]) || []);
    } catch (err) {
      console.error("Error fetching access vault:", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = async (entry: NewAccessVaultEntry) => {
    try {
      const { data, error } = await supabase
        .from("access_vault")
        .insert(entry)
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => [data as AccessVaultEntry, ...prev]);
      toast({
        title: "Acesso adicionado",
        description: "Credencial salva com sucesso.",
      });
    } catch (error: unknown) {
      console.error("Error adding entry:", error);
      toast({
        title: "Erro ao adicionar acesso",
        description: error instanceof Error ? error.message : "Não foi possível adicionar o acesso.",
        variant: "destructive",
      });
    }
  };

  const addEntries = async (newEntries: NewAccessVaultEntry[]) => {
    try {
      const { data, error } = await supabase
        .from("access_vault")
        .insert(newEntries)
        .select();

      if (error) throw error;

      setEntries(prev => [...(data as AccessVaultEntry[]), ...prev]);
      toast({
        title: `${(data as AccessVaultEntry[]).length} acessos adicionados`,
        description: "Credenciais salvas com sucesso.",
      });
    } catch (error: unknown) {
      console.error("Error adding entries:", error);
      toast({
        title: "Erro ao adicionar acessos",
        description: error instanceof Error ? error.message : "Não foi possível adicionar os acessos.",
        variant: "destructive",
      });
    }
  };

  const updateEntry = async ({ id, updates }: { id: string; updates: Partial<AccessVaultEntry> }) => {
    try {
      const { error } = await supabase
        .from("access_vault")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setEntries(prev => prev.map(entry =>
        entry.id === id ? { ...entry, ...updates } : entry
      ));
      toast({
        title: "Acesso atualizado",
        description: "As informações foram atualizadas com sucesso.",
      });
    } catch (error: unknown) {
      console.error("Error updating entry:", error);
      toast({
        title: "Erro ao atualizar acesso",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o acesso.",
        variant: "destructive",
      });
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from("access_vault")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setEntries(prev => prev.filter(entry => entry.id !== id));
      toast({
        title: "Acesso removido",
        description: "A credencial foi removida com sucesso.",
      });
    } catch (error: unknown) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Erro ao remover acesso",
        description: error instanceof Error ? error.message : "Não foi possível remover o acesso.",
        variant: "destructive",
      });
    }
  };

  return {
    entries,
    isLoading,
    addEntry,
    addEntries,
    updateEntry,
    deleteEntry,
    refetch: fetchEntries,
  };
};
