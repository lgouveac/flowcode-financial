
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { EditableCell } from "./EditableCell";

interface RecurringPayment {
  id: string;
  clientName: string;
  service: string;
  value: string;
  frequency: string;
  lastPayment?: string;
  nextPayment: string;
  status: "active" | "inactive" | "pending";
}

const mockPayments: RecurringPayment[] = [
  {
    id: "1",
    clientName: "Tech Solutions Ltda",
    service: "Consultoria Mensal",
    value: "5000.00",
    frequency: "Mensal",
    lastPayment: "2024-02-15",
    nextPayment: "2024-03-15",
    status: "active"
  },
  {
    id: "2",
    clientName: "Digital Marketing Co",
    service: "Manutenção de Sistema",
    value: "3500.00",
    frequency: "Mensal",
    lastPayment: "2024-02-10",
    nextPayment: "2024-03-10",
    status: "pending"
  }
];

export const RecurringBilling = () => {
  const [payments, setPayments] = useState(mockPayments);

  const handleChange = (id: string, field: keyof RecurringPayment, value: string) => {
    setPayments(prevPayments =>
      prevPayments.map(payment =>
        payment.id === id ? { ...payment, [field]: value } : payment
      )
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-display">Recebimentos Recorrentes</CardTitle>
        <Button className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Novo Recebimento
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Serviço</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Valor</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Frequência</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Último Pagamento</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Próximo Pagamento</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t hover:bg-muted/50">
                  <td className="p-4">
                    <EditableCell
                      value={payment.clientName}
                      onChange={(value) => handleChange(payment.id, 'clientName', value)}
                    />
                  </td>
                  <td className="p-4">
                    <EditableCell
                      value={payment.service}
                      onChange={(value) => handleChange(payment.id, 'service', value)}
                    />
                  </td>
                  <td className="p-4">
                    <EditableCell
                      value={payment.value}
                      onChange={(value) => handleChange(payment.id, 'value', value)}
                      type="number"
                    />
                  </td>
                  <td className="p-4">
                    <EditableCell
                      value={payment.frequency}
                      onChange={(value) => handleChange(payment.id, 'frequency', value)}
                    />
                  </td>
                  <td className="p-4">
                    <EditableCell
                      value={payment.lastPayment || ""}
                      onChange={(value) => handleChange(payment.id, 'lastPayment', value)}
                      type="date"
                    />
                  </td>
                  <td className="p-4">
                    <EditableCell
                      value={payment.nextPayment}
                      onChange={(value) => handleChange(payment.id, 'nextPayment', value)}
                      type="date"
                    />
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment.status === "active" 
                        ? "bg-green-100 text-green-800" 
                        : payment.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {payment.status === "active" ? "Ativo" 
                        : payment.status === "pending" ? "Pendente" 
                        : "Inativo"}
                    </span>
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
