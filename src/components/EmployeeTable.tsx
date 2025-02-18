
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { AddEmployeeDialog } from "./AddEmployeeDialog";

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-display">Funcionários e Freelancers</CardTitle>
        <AddEmployeeDialog />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="p-4 text-sm font-medium text-muted-foreground">Nome</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Tipo</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Método de Pagamento</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Última NF</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-t hover:bg-muted/50">
                  <td className="p-4">
                    <Input
                      value={employee.name}
                      onChange={(e) => handleChange(employee.id, 'name', e.target.value)}
                      className="h-8"
                    />
                  </td>
                  <td className="p-4">
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
                      {employee.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <Select
                      value={employee.paymentMethod}
                      onValueChange={(value) => handleChange(employee.id, 'paymentMethod', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="Transferência">Transferência</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4">
                    <Input
                      value={employee.lastInvoice}
                      onChange={(e) => handleChange(employee.id, 'lastInvoice', e.target.value)}
                      className="h-8"
                      type="date"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
