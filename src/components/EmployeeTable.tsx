
import { useState } from "react";
import { EditEmployeeDialog } from "./EditEmployeeDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeEmailSettings } from "./emails/EmployeeEmailSettings";
import { LoadingState } from "./employees/LoadingState";
import { ErrorState } from "./employees/ErrorState";
import { TableHeader } from "./employees/TableHeader";
import { EmployeeTableRow } from "./employees/EmployeeTableRow";
import { Button } from "./ui/button";
import { ImportCSV } from "./import/ImportCSV";

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

      // Ensure type field is correctly typed
      return (data || []).map(employee => ({
        ...employee,
        type: employee.type as "fixed" | "freelancer",
        status: employee.status as "active" | "inactive"
      }));
    },
  });

  if (isLoading) {
    return <LoadingState onSettingsClick={() => setSettingsOpen(true)} />;
  }

  if (error) {
    return <ErrorState onSettingsClick={() => setSettingsOpen(true)} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <TableHeader onSettingsClick={() => setSettingsOpen(true)} />
        <ImportCSV />
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
                  <EmployeeTableRow
                    key={employee.id}
                    employee={employee}
                    onClick={setSelectedEmployee}
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
