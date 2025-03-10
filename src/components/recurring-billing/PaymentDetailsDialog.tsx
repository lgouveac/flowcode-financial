
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Payment } from "@/types/payment";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { EditableCell } from "../EditableCell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaymentDetailsDialogProps {
  billingId: string | null;
  open: boolean;
  onClose: () => void;
}

export const PaymentDetailsDialog = ({ billingId, open, onClose }: PaymentDetailsDialogProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (billingId && open) {
      fetchPayments();
    }
  }, [billingId, open]);

  const fetchPayments = async () => {
    if (!billingId) return;
    
    setLoading(true);
    try {
      // Primeiro, buscar o client_id da cobrança recorrente
      const { data: billingData, error: billingError } = await supabase
        .from('recurring_billing')
        .select('client_id')
        .eq('id', billingId)
        .single();

      if (billingError) throw billingError;
      
      if (!billingData || !billingData.client_id) {
        throw new Error('Cobrança não encontrada ou sem cliente associado');
      }

      // Agora, buscar todos os pagamentos recorrentes deste cliente
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          clients (
            name
          )
        `)
        .eq('client_id', billingData.client_id)
        .not('installment_number', 'is', null)
        .order('installment_number', { ascending: true });

      if (error) throw error;
      
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes dos pagamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async (paymentId: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ [field]: value })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Pagamento atualizado",
        description: "As informações foram atualizadas com sucesso.",
      });

      fetchPayments();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o pagamento.",
        variant: "destructive",
      });
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes dos Pagamentos Recorrentes</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Carregando pagamentos...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Nenhum pagamento encontrado para esta cobrança.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Data Pgto.</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.installment_number}/{payment.total_installments}
                    </TableCell>
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
                      <input
                        type="date"
                        value={payment.payment_date || ''}
                        onChange={(e) => handleUpdatePayment(payment.id, 'payment_date', e.target.value)}
                        className={`w-full bg-transparent ${payment.status === 'paid' ? '' : 'opacity-50'}`}
                        disabled={payment.status !== 'paid'}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
