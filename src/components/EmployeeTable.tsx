
import { useState } from "react";
import { EditEmployeeDialog } from "./EditEmployeeDialog";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeEmailSettings } from "./emails/EmployeeEmailSettings";
import { LoadingState } from "./employees/LoadingState";
import { ErrorState } from "./employees/ErrorState";
import { TableHeader } from "./employees/TableHeader";
import { EmployeeTableRow } from "./employees/EmployeeTableRow";
import { Button } from "./ui/button";
import { ImportCSV } from "./import/ImportCSV";
import { useToast } from "./ui/use-toast";
import { TestEmployeeNotificationButton } from "./emails/TestEmployeeNotificationButton";

interface Employee {
  id: string;
  name: string;
  type: "fixed" | "freelancer";
  status: "active" | "inactive";
  payment_method: string;
  last_invoice?: string;
  cnpj?: string;
  pix?: string;
  address?: string;
  position?: string;
  phone?: string;
  email: string;
}

export const EmployeeTable = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["global-settings"],
    queryFn: async () => {
      const { data: globalSettings, error: globalError } = await supabase
        .from("global_settings")
        .select("*")
        .single();

      if (globalError) {
        console.error("Error fetching global settings:", globalError);
      }

      const { data: emailSettings, error: emailError } = await supabase
        .from("email_notification_settings")
        .select("*")
        .single();

      if (emailError) {
        console.error("Error fetching email settings:", emailError);
      }

      return {
        ...globalSettings,
        notificationTime: emailSettings?.notification_time || "09:00"
      };
    },
  });

  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching employees:", error);
        throw error;
      }

      // Ensure type field is correctly typed
      return (data || []).map(employee => ({
        ...employee,
        type: employee.type as "fixed" | "freelancer",
        status: employee.status as "active" | "inactive"
      }));
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: keyof Employee; value: any }) => {
      const { error } = await supabase
        .from("employees")
        .update({ [field]: value })
        .eq("id", id);

      if (error) {
        console.error(`Error updating employee ${field}:`, error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({
        title: "Sucesso",
        description: "Funcionário atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o funcionário.",
        variant: "destructive",
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      // First check for related monthly values
      const { data: monthlyValues, error: monthlyError } = await supabase
        .from("employee_monthly_values")
        .select("id")
        .eq("employee_id", id);
        
      if (monthlyError) {
        console.error("Error checking monthly values:", monthlyError);
        throw monthlyError;
      }
      
      // If there are monthly values, delete them first
      if (monthlyValues && monthlyValues.length > 0) {
        const { error: deleteMonthlyError } = await supabase
          .from("employee_monthly_values")
          .delete()
          .eq("employee_id", id);
          
        if (deleteMonthlyError) {
          console.error("Error deleting monthly values:", deleteMonthlyError);
          throw deleteMonthlyError;
        }
      }
      
      // Check for related cash flow entries
      const { data: cashFlowEntries, error: cashFlowError } = await supabase
        .from("cash_flow")
        .select("id")
        .eq("employee_id", id);
        
      if (cashFlowError) {
        console.error("Error checking cash flow entries:", cashFlowError);
        throw cashFlowError;
      }
      
      // If there are cash flow entries, update them to remove the employee reference
      if (cashFlowEntries && cashFlowEntries.length > 0) {
        const { error: updateCashFlowError } = await supabase
          .from("cash_flow")
          .update({ employee_id: null })
          .eq("employee_id", id);
          
        if (updateCashFlowError) {
          console.error("Error updating cash flow entries:", updateCashFlowError);
          throw updateCashFlowError;
        }
      }
      
      // Finally, delete the employee
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting employee:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({
        title: "Sucesso",
        description: "Funcionário excluído com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Delete mutation error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o funcionário.",
        variant: "destructive",
      });
    },
  });

  const handleEmployeeChange = (id: string, field: keyof Employee, value: any) => {
    updateEmployeeMutation.mutate({ id, field, value });
  };

  const handleEmployeeDelete = (id: string) => {
    deleteEmployeeMutation.mutate(id);
  };

  if (isLoading) {
    return <LoadingState onSettingsClick={() => setSettingsOpen(true)} />;
  }

  if (error) {
    return <ErrorState onSettingsClick={() => setSettingsOpen(true)} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <TableHeader onSettingsClick={() => setSettingsOpen(true)} />
        <div className="flex items-center gap-2">
          <ImportCSV />
          <TestEmployeeNotificationButton /> {/* This component was causing errors */}
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="rounded-lg border bg-background/50 p-8 text-center">
          <p className="text-muted-foreground">Nenhum funcionário cadastrado</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card/50 backdrop-blur-sm">
          <div className="w-full overflow-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Nome</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">Tipo</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">Método de Pagamento</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground hidden lg:table-cell">Última NF</th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <EmployeeTableRow
                    key={employee.id}
                    employee={employee}
                    onClick={setSelectedEmployee}
                    onStatusChange={(value) => handleEmployeeChange(employee.id, "status", value)}
                    onDelete={handleEmployeeDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EmployeeEmailSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentDay={settings?.employee_emails_send_day}
        currentTime={settings?.notificationTime?.substring(0, 5)}
      />

      <EditEmployeeDialog
        employee={selectedEmployee}
        open={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["employees"] });
          setSelectedEmployee(null);
        }}
      />
    </div>
  );
};
