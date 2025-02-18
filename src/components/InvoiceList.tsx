
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { AddInvoiceDialog } from "./AddInvoiceDialog";

interface Invoice {
  id: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  paymentMethod: string;
}

const mockInvoices: Invoice[] = [
  {
    id: "1",
    clientName: "Tech Solutions Ltd",
    amount: 3500.00,
    dueDate: "15/04/2024",
    status: "pending",
    paymentMethod: "PIX",
  },
  {
    id: "2",
    clientName: "Digital Marketing Co",
    amount: 2800.00,
    dueDate: "10/04/2024",
    status: "overdue",
    paymentMethod: "Transferência",
  },
  {
    id: "3",
    clientName: "Software Services Inc",
    amount: 5200.00,
    dueDate: "20/04/2024",
    status: "paid",
    paymentMethod: "Cartão",
  },
];

export const InvoiceList = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-display">Faturas</CardTitle>
        <AddInvoiceDialog />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Valor</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Vencimento</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Método</th>
              </tr>
            </thead>
            <tbody>
              {mockInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-t hover:bg-muted/50">
                  <td className="p-4">{invoice.clientName}</td>
                  <td className="p-4">R$ {invoice.amount.toFixed(2)}</td>
                  <td className="p-4">{invoice.dueDate}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invoice.status === "paid" 
                        ? "bg-green-100 text-green-800"
                        : invoice.status === "overdue"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {invoice.status === "paid" ? "Pago" 
                        : invoice.status === "overdue" ? "Atrasado" 
                        : "Pendente"}
                    </span>
                  </td>
                  <td className="p-4">{invoice.paymentMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
