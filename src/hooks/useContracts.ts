
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Contract } from "@/types/contract";
import { createProjectFromContract } from "@/services/contractProjectSync";

export const useContracts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      console.log("Fetching contracts...");
      
      const { data, error } = await supabase
        .from("contratos")
        .select(`
          *,
          clients!fk_contratos_client (
            name,
            email,
            type
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching contracts:", error);
        toast({
          title: "Erro ao carregar contratos",
          description: "Não foi possível carregar os contratos.",
          variant: "destructive",
        });
        throw error;
      }

      
      // Transform the data to match the expected type
      return data.map(contract => ({
        ...contract,
        clients: contract.clients || null
      })) as (Contract & { clients: { name: string; email: string; type: string } | null })[];
    },
  });

  const addContract = async (contract: Omit<Contract, "id" | "created_at" | "updated_at">) => {
    try {
      console.log("Adding contract:", contract);
      
      // Validate that client_id exists if provided
      if (contract.client_id) {
        const { data: clientExists, error: clientError } = await supabase
          .from("clients")
          .select("id")
          .eq("id", contract.client_id)
          .single();

        if (clientError || !clientExists) {
          throw new Error("Cliente selecionado não existe");
        }
      }
      
      const { data, error } = await supabase
        .from("contratos")
        .insert(contract)
        .select()
        .single();

      if (error) throw error;

      // Criar projeto automaticamente a partir do contrato
      try {
        await createProjectFromContract({
          id: data.id,
          scope: data.scope,
          client_id: data.client_id,
          status: data.status,
          clients: data.clients
        });
      } catch (projectError) {
        console.error("Error creating project from contract:", projectError);
        // Não falha a criação do contrato se houver erro na criação do projeto
      }

      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      toast({
        title: "Contrato adicionado",
        description: `Contrato e projeto criados com sucesso.`,
      });

      return data;
    } catch (error: any) {
      console.error("Error adding contract:", error);
      toast({
        title: "Erro ao adicionar contrato",
        description: error.message || "Não foi possível adicionar o contrato.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateContract = async (id: number, updates: Partial<Contract>) => {
    try {
      console.log("Updating contract:", id, updates);
      
      // Validate that client_id exists if being updated
      if (updates.client_id) {
        const { data: clientExists, error: clientError } = await supabase
          .from("clients")
          .select("id")
          .eq("id", updates.client_id)
          .single();

        if (clientError || !clientExists) {
          throw new Error("Cliente selecionado não existe");
        }
      }
      
      const { error } = await supabase
        .from("contratos")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["contracts"] });

      toast({
        title: "Contrato atualizado",
        description: "As informações do contrato foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      console.error("Error updating contract:", error);
      toast({
        title: "Erro ao atualizar contrato",
        description: error.message || "Não foi possível atualizar o contrato.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteContract = async (id: number) => {
    try {
      console.log("Deleting contract:", id);
      
      const { error } = await supabase
        .from("contratos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["contracts"] });

      toast({
        title: "Contrato removido",
        description: "O contrato foi removido com sucesso.",
      });
    } catch (error: any) {
      console.error("Error deleting contract:", error);
      toast({
        title: "Erro ao remover contrato",
        description: error.message || "Não foi possível remover o contrato.",
        variant: "destructive",
      });
    }
  };

  return {
    contracts,
    isLoading,
    addContract,
    updateContract,
    deleteContract
  };
};
