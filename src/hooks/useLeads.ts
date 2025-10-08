import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lead, NewLead } from "@/types/lead";

export const useLeads = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        console.log("Fetching leads...");

        const { data, error } = await supabase
          .from("leads")
          .select("id, Nome, Email, Celular, Valor, Status, created_at, won_at");

        console.log("Supabase response:", { data, error });

        if (error) {
          console.error("Error:", error);
          toast({
            title: "Erro ao carregar leads",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        console.log(`Found ${data?.length || 0} leads`);
        setLeads(data || []);
      } catch (err) {
        console.error("Catch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, [toast]);

  const addLead = async (lead: NewLead) => {
    try {
      console.log("Adding lead:", lead);

      const { data, error } = await supabase
        .from("leads")
        .insert(lead)
        .select()
        .single();

      if (error) throw error;

      setLeads(prev => [data as Lead, ...prev]);
      toast({
        title: "Lead adicionado",
        description: "Lead criado com sucesso.",
      });
    } catch (error: any) {
      console.error("Error adding lead:", error);
      toast({
        title: "Erro ao adicionar lead",
        description: error.message || "Não foi possível adicionar o lead.",
        variant: "destructive",
      });
    }
  };

  const updateLead = async ({ id, updates }: { id: number; updates: Partial<Lead> }) => {
    try {
      console.log("Updating lead:", id, updates);

      // If status is being changed to "Won", automatically set won_at
      if (updates.Status === "Won") {
        updates.won_at = new Date().toISOString();
      }
      // If status is being changed from "Won" to something else, clear won_at
      else if (updates.Status && updates.Status !== "Won") {
        const currentLead = leads.find(lead => lead.id === id);
        if (currentLead?.Status === "Won") {
          updates.won_at = null;
        }
      }

      const { error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setLeads(prev => prev.map(lead =>
        lead.id === id ? { ...lead, ...updates } : lead
      ));
      toast({
        title: "Lead atualizado",
        description: "As informações do lead foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      console.error("Error updating lead:", error);
      toast({
        title: "Erro ao atualizar lead",
        description: error.message || "Não foi possível atualizar o lead.",
        variant: "destructive",
      });
    }
  };

  const deleteLead = async (id: number) => {
    try {
      console.log("Deleting lead:", id);

      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setLeads(prev => prev.filter(lead => lead.id !== id));
      toast({
        title: "Lead removido",
        description: "O lead foi removido com sucesso.",
      });
    } catch (error: any) {
      console.error("Error deleting lead:", error);
      toast({
        title: "Erro ao remover lead",
        description: error.message || "Não foi possível remover o lead.",
        variant: "destructive",
      });
    }
  };

  return {
    leads,
    isLoading,
    addLead,
    updateLead,
    deleteLead,
    isAddingLead: false,
    isUpdatingLead: false,
    isDeletingLead: false,
  };
};