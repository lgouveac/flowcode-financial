
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { AddEmployeeDialog } from "./AddEmployeeDialog";
import { EditableCell } from "./EditableCell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Employee {
  id: string;
  name: string;
  type: "fixed" | "freelancer";
  status: "active" | "inactive";
  paymentMethod: string;
  lastInvoice?: string;
}

const mockEmployees: Employee[] = [
  {
    id: "1",
    name: "João Silva",
    type: "fixed",
    status: "active",
    paymentMethod: "PIX",
    lastInvoice: "10/03/2024",
  },
  {
    id: "2",
    name: "Maria Santos",
    type: "freelancer",
    status: "active",
    paymentMethod: "Transferência",
    lastInvoice: "05/03/2024",
  },
];

export const EmployeeTable = () => {
  const [employees, setEmployees] = useState(mockEmployees);

  const handleChange = (id: string, field: keyof Employee, value: string) => {
    setEmployees(prevEmployees =>
      prevEmployees.map(employee =>
        employee.id === id ? { ...employee, [field]: value } : employee
      )
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Funcionários e Freelancers</h1>
        <AddEmployeeDialog />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="w-full overflow-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-zinc-50">
              <tr className="text-left">
                <th className="py-3 px-4 text-sm font-medium text-muted-foreground">Nome</th>
                <th className="py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Tipo</th>
                <th className="py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Método de Pagamento</th>
                <th className="py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Última NF</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-t hover:bg-zinc-50">
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employee.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {employee.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <EditableCell
                      value={employee.paymentMethod}
                      onChange={(value) => handleChange(employee.id, 'paymentMethod', value)}
                    />
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <EditableCell
                      value={employee.lastInvoice || ""}
                      onChange={(value) => handleChange(employee.id, 'lastInvoice', value)}
                      type="date"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        
      {/* Visão mobile para informações ocultas */}
      <div className="block md:hidden mt-4 space-y-4">
        {employees.map((employee) => (
          <div key={`mobile-${employee.id}`} className="p-4 rounded-lg border border-zinc-200 bg-white space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Método de Pagamento</label>
                <EditableCell
                  value={employee.paymentMethod}
                  onChange={(value) => handleChange(employee.id, 'paymentMethod', value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Última NF</label>
                <EditableCell
                  value={employee.lastInvoice || ""}
                  onChange={(value) => handleChange(employee.id, 'lastInvoice', value)}
                  type="date"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
