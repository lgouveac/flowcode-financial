
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect } from "react";
import type { Employee } from "@/components/emails/types/emailTest";

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedEmployee: Employee | null;
  onSelect: (employee: Employee | null) => void;
}

export const EmployeeSelector = ({ 
  employees, 
  selectedEmployee, 
  onSelect 
}: EmployeeSelectorProps) => {
  // Debug logs
  useEffect(() => {
    console.log("EmployeeSelector employees:", employees);
    console.log("EmployeeSelector selectedEmployee:", selectedEmployee);
  }, [employees, selectedEmployee]);

  if (!employees || employees.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
        Nenhum funcionário encontrado
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Selecione um funcionário:</h3>
      <ScrollArea className="h-[200px] rounded-md border p-2">
        <div className="space-y-1">
          {employees.map((employee) => (
            <button
              key={employee.id}
              type="button"
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                selectedEmployee?.id === employee.id ? "bg-accent" : ""
              }`}
              onClick={() => onSelect(employee)}
            >
              <div className="font-medium">{employee.name}</div>
              <div className="text-xs text-muted-foreground">{employee.email}</div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
