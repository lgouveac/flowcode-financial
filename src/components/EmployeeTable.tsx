
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AddEmployeeDialog } from "./AddEmployeeDialog";
import { EditEmployeeDialog } from "./EditEmployeeDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Settings } from "lucide-react";
import { EmployeeEmailSettings } from "./emails/EmployeeEmailSettings";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["global-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_settings")
        .select("*")
        .single();

      if (error) {
        console.error("Error fetching settings:", error);
        throw error;
      }

      return data;
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

      return data || [];
    },
  });

  const handleChange = async (id: string, field: keyof Employee, value: string) => {
    try {
      const { error } = await supabase
        .from("employees")
        .update({ [field]: value })
        .eq("id", id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["employees"] });

      toast({
        title: "Alteração salva",
        description: "O funcionário foi atualizado com sucesso.",
      });
    } catch (error: any) {
      console.error("Error updating employee:", error);
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao atualizar o funcionário.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Funcionários e Freelancers</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <AddEmployeeDialog />
          </div>
        </div>
        <div className="rounded-lg border bg-card/50 backdrop-blur-sm p-8">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Funcionários e Freelancers</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <AddEmployeeDialog />
          </div>
        </div>
        <div className="rounded-lg border bg-destructive/10 p-8">
          <p className="text-center text-destructive">Erro ao carregar funcionários</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Funcionários e Freelancers</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            title="Configurações de email"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <AddEmployeeDialog />
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
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-t border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <td className="p-4">{employee.name}</td>
                    <td className="p-4 hidden sm:table-cell">
                      {employee.type === "fixed" ? "Funcionário Fixo" : "Freelancer"}
                    </td>
                    <td className="p-4">
                      {employee.status === "active" ? "Ativo" : "Inativo"}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      {employee.payment_method || "-"}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {employee.last_invoice || "-"}
                    </td>
                  </tr>
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

