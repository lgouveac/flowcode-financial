
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EditableCell } from "../EditableCell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Payment } from "@/types/payment";

interface PaymentTableProps {
  payments: Array<Payment & { clients?: { name: string; partner_name?: string } }>;
  onRefresh?: () => void;
}

export const PaymentTable = ({ payments, onRefresh }: PaymentTableProps) => {
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  // Only show payments that don't have an installment number (one-time payments)
  const oneTimePayments = payments.filter(payment => 
    payment.installment_number === null
  );

  const handleUpdatePayment = async (paymentId: string, field: string, value: any) => {
    try {
      console.log('Updating payment:', { paymentId, field, value });
      
      const { error } = await supabase
        .from('payments')
        .update({ [field]: value })
        .eq('id', paymentId);

      if (error) {
        console.error('Error updating payment:', error);
        throw error;
      }

      toast({
        title: "Pagamento atualizado",
        description: "As informações foram atualizadas com sucesso.",
      });
      
      // Call the refresh function if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o pagamento.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (paymentId: string) => {
    setPaymentToDelete(paymentId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentToDelete);

      if (error) throw error;

      toast({
        title: "Pagamento excluído",
        description: "O pagamento foi excluído com sucesso.",
      });
      
      // Call the refresh function if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o pagamento.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteConfirm(false);
      setPaymentToDelete(null);
    }
  };

  const getStatusBadgeVariant = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: Payment['status']) => {
    const statusLabels: Record<Payment['status'], string> = {
      pending: 'Pendente',
      billed: 'Faturado',
      awaiting_invoice: 'Aguardando Fatura',
      paid: 'Pago',
      overdue: 'Atrasado',
      cancelled: 'Cancelado'
    };
    return statusLabels[status];
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Responsável</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead>Método</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {oneTimePayments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>{payment.clients?.name}</TableCell>
            <TableCell>{payment.clients?.partner_name || "-"}</TableCell>
            <TableCell>
              <EditableCell
                value={payment.description}
                onChange={(value) => handleUpdatePayment(payment.id, 'description', value)}
              />
            </TableCell>
            <TableCell>
              <EditableCell
                value={payment.amount.toString()}
                onChange={(value) => handleUpdatePayment(payment.id, 'amount', parseFloat(value))}
                type="number"
              />
            </TableCell>
            <TableCell>
              <input
                type="date"
                value={payment.due_date}
                onChange={(e) => handleUpdatePayment(payment.id, 'due_date', e.target.value)}
                className="w-full bg-transparent"
              />
            </TableCell>
            <TableCell>
              <Select
                value={payment.payment_method}
                onValueChange={(value) => handleUpdatePayment(payment.id, 'payment_method', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Select
                value={payment.status}
                onValueChange={(value) => handleUpdatePayment(payment.id, 'status', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    <Badge variant={getStatusBadgeVariant(payment.status)}>
                      {getStatusLabel(payment.status)}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="billed">Faturado</SelectItem>
                  <SelectItem value="awaiting_invoice">Aguardando Fatura</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteClick(payment.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pagamento?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPaymentToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Table>
  );
};
