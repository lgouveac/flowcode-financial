
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Contract } from "@/types/contract";

export const useContracts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      console.log("Fetching contracts...");
      
      const { data, error } = await supabase
        .from("Contratos")
        .select(`
          *,
          clients (
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

      console.log(`Found ${data?.length || 0} contracts`);
      return data as (Contract & { clients: { name: string; email: string; type: string } })[];
    },
  });

  const addContract = async (contract: Omit<Contract, "id" | "created_at" | "updated_at">) => {
    try {
      console.log("Adding contract:", contract);
      
      // Calculate installment value if not provided
      const installmentValue = contract.installment_value || 
        (contract.total_value && contract.installments ? contract.total_value / contract.installments : 0);
      
      const { data, error } = await supabase
        .from("Contratos")
        .insert({
          ...contract,
          installment_value: installmentValue,
        })
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["contracts"] });

      toast({
        title: "Contrato adicionado",
        description: `Contrato criado com sucesso.`,
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
      
      // Recalculate installment value if total_value or installments changed
      if (updates.total_value || updates.installments) {
        const contract = contracts.find(c => c.id === id);
        if (contract) {
          const totalValue = updates.total_value ?? contract.total_value ?? 0;
          const installments = updates.installments ?? contract.installments ?? 1;
          updates.installment_value = totalValue / installments;
        }
      }
      
      const { error } = await supabase
        .from("Contratos")
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
        .from("Contratos")
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
      throw error;
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
