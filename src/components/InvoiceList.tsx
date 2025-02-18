
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { AddInvoiceDialog } from "./AddInvoiceDialog";
import { EditableCell } from "./EditableCell";

interface Invoice {
  id: string;
  clientName: string;
  value: string;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  paymentDate?: string;
}

const mockInvoices: Invoice[] = [
  {
    id: "1",
    clientName: "Tech Solutions Ltda",
    value: "15000.00",
    dueDate: "2024-03-15",
    status: "pending"
  },
  {
    id: "2",
    clientName: "Digital Marketing Co",
    value: "8500.00",
    dueDate: "2024-03-10",
    status: "paid",
    paymentDate: "2024-03-08"
  }
];

export const InvoiceList = () => {
  const [invoices, setInvoices] = useState(mockInvoices);

  const handleChange = (id: string, field: keyof Invoice, value: string) => {
    setInvoices(prevInvoices =>
      prevInvoices.map(invoice =>
        invoice.id === id ? { ...invoice, [field]: value } : invoice
      )
    );
  };

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
                <th className="p-4 text-sm font-medium text-muted-foreground">Data Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t hover:bg-muted/50">
                  <td className="p-4">
                    <EditableCell
                      value={invoice.clientName}
                      onChange={(value) => handleChange(invoice.id, 'clientName', value)}
                    />
                  </td>
                  <td className="p-4">
                    <EditableCell
                      value={invoice.value}
                      onChange={(value) => handleChange(invoice.id, 'value', value)}
                      type="number"
                    />
                  </td>
                  <td className="p-4">
                    <EditableCell
                      value={invoice.dueDate}
                      onChange={(value) => handleChange(invoice.id, 'dueDate', value)}
                      type="date"
                    />
                  </td>
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
                  <td className="p-4">
                    <EditableCell
                      value={invoice.paymentDate || ""}
                      onChange={(value) => handleChange(invoice.id, 'paymentDate', value)}
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
