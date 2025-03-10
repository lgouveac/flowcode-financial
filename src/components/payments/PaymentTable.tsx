
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EditableCell } from "../EditableCell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Payment } from "@/types/payment";

interface PaymentTableProps {
  payments: Array<Payment & { clients?: { name: string } }>;
}

export const PaymentTable = ({ payments }: PaymentTableProps) => {
  const { toast } = useToast();

  // Filter out any payments that are part of recurring billings
  const oneTimePayments = payments.filter(payment => 
    !payment.description.includes('(') || !payment.description.includes('/')
  );

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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Data Pgto.</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {oneTimePayments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{payment.clients?.name}</TableCell>
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
  );
};
