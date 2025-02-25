
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AddEmployeeDialog } from "./AddEmployeeDialog";
import { EditableCell } from "./EditableCell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Employee {
  id: string;
  name: string;
  type: "fixed" | "freelancer";
  status: "active" | "inactive";
  payment_method: string;
  last_invoice?: string;
}

export const EmployeeTable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
          <AddEmployeeDialog />
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
          <AddEmployeeDialog />
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
        <AddEmployeeDialog />
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
                  <tr key={employee.id} className="border-t border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <EditableCell
                          value={employee.name}
                          onChange={(value) => handleChange(employee.id, 'name', value)}
                        />
                        <div className="sm:hidden">
                          <Select
                            value={employee.type}
                            onValueChange={(value: "fixed" | "freelancer") => handleChange(employee.id, 'type', value)}
                          >
                            <SelectTrigger className="h-8 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Funcionário Fixo</SelectItem>
                              <SelectItem value="freelancer">Freelancer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <Select
                        value={employee.type}
                        onValueChange={(value: "fixed" | "freelancer") => handleChange(employee.id, 'type', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Funcionário Fixo</SelectItem>
                          <SelectItem value="freelancer">Freelancer</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4">
                      <Select
                        value={employee.status}
                        onValueChange={(value: "active" | "inactive") => handleChange(employee.id, 'status', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <EditableCell
                        value={employee.payment_method || ""}
                        onChange={(value) => handleChange(employee.id, 'payment_method', value)}
                      />
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <EditableCell
                        value={employee.last_invoice || ""}
                        onChange={(value) => handleChange(employee.id, 'last_invoice', value)}
                        type="date"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
