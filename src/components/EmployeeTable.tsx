
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

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
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-display">Funcionários e Freelancers</CardTitle>
        <Button size="sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Novo Colaborador
        </Button>
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
              {mockEmployees.map((employee) => (
                <tr key={employee.id} className="border-t hover:bg-muted/50">
                  <td className="p-4">{employee.name}</td>
                  <td className="p-4 capitalize">{employee.type}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employee.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="p-4">{employee.paymentMethod}</td>
                  <td className="p-4">{employee.lastInvoice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
