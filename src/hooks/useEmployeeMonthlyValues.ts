
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeMonthlyValue } from "@/types/employee";

export const useEmployeeMonthlyValues = (employeeId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: monthlyValues = [], isLoading } = useQuery({
    queryKey: ["employee-monthly-values", employeeId],
    queryFn: async () => {
      console.log(`Fetching monthly values for employee: ${employeeId}`);
      
      const { data, error } = await supabase
        .from("employee_monthly_values")
        .select("*")
        .eq("employee_id", employeeId)
        .order("due_date", { ascending: false });

      if (error) {
        console.error("Error fetching monthly values:", error);
        toast({
          title: "Erro ao carregar valores mensais",
          description: "Não foi possível carregar os valores mensais deste funcionário.",
          variant: "destructive",
        });
        throw error;
      }

      console.log(`Found ${data?.length || 0} monthly values for employee ${employeeId}`);
      return data as EmployeeMonthlyValue[];
    },
    enabled: !!employeeId,
  });

  const addMonthlyValue = async (monthlyValue: Omit<EmployeeMonthlyValue, "id" | "created_at" | "updated_at">) => {
    try {
      console.log("Adding monthly value:", monthlyValue);
      
      const { data, error } = await supabase
        .from("employee_monthly_values")
        .insert({
          employee_id: employeeId,
          due_date: monthlyValue.due_date,
          due_data: monthlyValue.due_data,
          notes: monthlyValue.notes,
        })
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["employee-monthly-values", employeeId] });

      toast({
        title: "Valor mensal adicionado",
        description: `Valor de R$ ${monthlyValue.due_data} adicionado para ${new Date(monthlyValue.due_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      });

      return data;
    } catch (error: any) {
      console.error("Error adding monthly value:", error);
      toast({
        title: "Erro ao adicionar valor mensal",
        description: error.message || "Não foi possível adicionar o valor mensal.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateMonthlyValue = async (monthlyValue: EmployeeMonthlyValue) => {
    try {
      console.log("Updating monthly value:", monthlyValue);
      
      const { error } = await supabase
        .from("employee_monthly_values")
        .update({
          due_data: monthlyValue.due_data,
          notes: monthlyValue.notes,
        })
        .eq("id", monthlyValue.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["employee-monthly-values", employeeId] });

      toast({
        title: "Valor mensal atualizado",
        description: `Valor atualizado para ${new Date(monthlyValue.due_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      });
    } catch (error: any) {
      console.error("Error updating monthly value:", error);
      toast({
        title: "Erro ao atualizar valor mensal",
        description: error.message || "Não foi possível atualizar o valor mensal.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    monthlyValues,
    isLoading,
    addMonthlyValue,
    updateMonthlyValue
  };
};
