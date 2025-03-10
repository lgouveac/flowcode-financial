
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Payment } from "@/types/payment";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          clients (
            name
          )
        `)
        .order('installment_number', { ascending: true })
        .contains('description', `(${billingId})`);

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
          <DialogTitle>Detalhes dos Pagamentos</DialogTitle>
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
                    <TableCell>{payment.description}</TableCell>
                    <TableCell>
                      {payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell>
                      {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {payment.payment_date 
                        ? new Date(payment.payment_date).toLocaleDateString('pt-BR') 
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {payment.payment_method === 'pix' 
                        ? 'PIX' 
                        : payment.payment_method === 'boleto' 
                          ? 'Boleto' 
                          : 'Cartão de Crédito'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(payment.status)}>
                        {getStatusLabel(payment.status)}
                      </Badge>
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
