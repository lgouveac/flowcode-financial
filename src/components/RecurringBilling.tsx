
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

interface RecurringBill {
  id: string;
  clientName: string;
  value: number;
  frequency: string;
  nextDue: string;
  status: "active" | "overdue" | "cancelled";
}

const mockBills: RecurringBill[] = [
  {
    id: "1",
    clientName: "Tech Solutions Ltd",
    value: 1500.00,
    frequency: "Mensal",
    nextDue: "15/04/2024",
    status: "active",
  },
  {
    id: "2",
    clientName: "Digital Marketing Co",
    value: 2800.00,
    frequency: "Mensal",
    nextDue: "20/04/2024",
    status: "overdue",
  },
];

export const RecurringBilling = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-display">Cobranças Recorrentes</CardTitle>
        <Button size="sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Nova Cobrança
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Valor</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Frequência</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Próximo Vencimento</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockBills.map((bill) => (
                <tr key={bill.id} className="border-t hover:bg-muted/50">
                  <td className="p-4">{bill.clientName}</td>
                  <td className="p-4">R$ {bill.value.toFixed(2)}</td>
                  <td className="p-4">{bill.frequency}</td>
                  <td className="p-4">{bill.nextDue}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      bill.status === "active" 
                        ? "bg-green-100 text-green-800" 
                        : bill.status === "overdue"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {bill.status}
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
