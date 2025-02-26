
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
      const { data, error } = await supabase
        .from("employee_monthly_values")
        .select("*")
        .eq("employee_id", employeeId)
        .order("month", { ascending: false });

      if (error) {
        console.error("Error fetching monthly values:", error);
        toast({
          title: "Erro ao carregar valores mensais",
          description: "Não foi possível carregar os valores mensais deste funcionário.",
          variant: "destructive",
        });
        throw error;
      }

      return data;
    },
  });

  const addMonthlyValue = async (monthlyValue: Omit<EmployeeMonthlyValue, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("employee_monthly_values")
        .insert({
          employee_id: employeeId,
          month: monthlyValue.month,
          amount: monthlyValue.amount,
          notes: monthlyValue.notes,
        })
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["employee-monthly-values", employeeId] });

      toast({
        title: "Valor mensal adicionado",
        description: `Valor de R$ ${monthlyValue.amount} adicionado para ${new Date(monthlyValue.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
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
      const { error } = await supabase
        .from("employee_monthly_values")
        .update({
          amount: monthlyValue.amount,
          notes: monthlyValue.notes,
        })
        .eq("id", monthlyValue.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["employee-monthly-values", employeeId] });

      toast({
        title: "Valor mensal atualizado",
        description: `Valor atualizado para ${new Date(monthlyValue.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
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
