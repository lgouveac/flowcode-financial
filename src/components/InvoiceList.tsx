
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, Trash2 } from "lucide-react";
import { AddInvoiceDialog } from "./AddInvoiceDialog";
import { EditableCell } from "./EditableCell";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

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
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteRestricted, setShowDeleteRestricted] = useState(false);
  const { toast } = useToast();

  const handleChange = (id: string, field: keyof Invoice, value: string) => {
    setInvoices(prevInvoices =>
      prevInvoices.map(invoice =>
        invoice.id === id ? { ...invoice, [field]: value } : invoice
      )
    );
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Find the invoice to check its status
    const invoice = invoices.find(inv => inv.id === id);
    
    if (!invoice) {
      console.error("Invoice not found:", id);
      return;
    }
    
    // Check if invoice is in a status that cannot be deleted
    if (invoice.status === 'paid') {
      toast({
        title: "Operação não permitida",
        description: "Não é possível excluir uma fatura que já foi paga.",
        variant: "destructive",
      });
      return;
    }
    
    setInvoiceToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!invoiceToDelete) return;
    
    setInvoices(prevInvoices => 
      prevInvoices.filter(invoice => invoice.id !== invoiceToDelete)
    );
    
    toast({
      title: "Fatura excluída",
      description: "A fatura foi excluída com sucesso."
    });
    
    setInvoiceToDelete(null);
    setShowDeleteConfirm(false);
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
                <th className="p-4 text-sm font-medium text-muted-foreground">Ações</th>
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
                  <td className="p-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteClick(invoice.id, e)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta fatura?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setInvoiceToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
