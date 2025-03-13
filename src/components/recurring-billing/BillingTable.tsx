
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentDetailsDialog } from "./PaymentDetailsDialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Eye, Trash2 } from "lucide-react";
import type { RecurringBilling } from "@/types/billing";

interface BillingTableProps {
  billings: Array<RecurringBilling & { 
    clients?: { 
      name: string; 
      email?: string;
    } | null;
  }>;
  onRefresh?: () => void;
}

export const BillingTable = ({ billings, onRefresh }: BillingTableProps) => {
  const { toast } = useToast();
  const [selectedBillingId, setSelectedBillingId] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [billingToDelete, setBillingToDelete] = useState<string | null>(null);

  const handleViewDetails = (billingId: string) => {
    setSelectedBillingId(billingId);
    setShowDetailsDialog(true);
  };

  const handleDeleteClick = (billingId: string) => {
    setBillingToDelete(billingId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!billingToDelete) return;

    try {
      // First delete any related payment records
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .eq('recurring_billing_id', billingToDelete);

      if (paymentsError) {
        console.error('Error deleting related payments:', paymentsError);
        // Continue anyway as there might not be any related payments
      }

      // Then delete the recurring billing record
      const { error } = await supabase
        .from('recurring_billing')
        .delete()
        .eq('id', billingToDelete);

      if (error) throw error;

      toast({
        title: "Recebimento excluído",
        description: "O recebimento recorrente foi excluído com sucesso.",
      });
      
      // Call the refresh function if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting recurring billing:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o recebimento recorrente.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteConfirm(false);
      setBillingToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge>Pago</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Atrasado</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodLabels: Record<string, string> = {
      pix: 'PIX',
      boleto: 'Boleto',
      credit_card: 'Cartão de Crédito'
    };
    return methodLabels[method] || method;
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Dia Venc.</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Parcela</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {billings.map((billing) => (
            <TableRow key={billing.id}>
              <TableCell>{billing.clients?.name}</TableCell>
              <TableCell>{billing.description}</TableCell>
              <TableCell>R$ {billing.amount.toFixed(2)}</TableCell>
              <TableCell>{billing.due_day}</TableCell>
              <TableCell>{billing.payment_date ? formatDate(billing.payment_date) : '-'}</TableCell>
              <TableCell>{getPaymentMethodLabel(billing.payment_method)}</TableCell>
              <TableCell>{getStatusBadge(billing.status)}</TableCell>
              <TableCell>
                {billing.current_installment}/{billing.installments}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewDetails(billing.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(billing.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedBillingId && (
        <PaymentDetailsDialog
          billingId={selectedBillingId}
          open={showDetailsDialog}
          onClose={() => {
            setShowDetailsDialog(false);
            setSelectedBillingId(null);
          }}
        />
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este recebimento recorrente? Esta ação não pode ser desfeita e também excluirá todos os pagamentos associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
