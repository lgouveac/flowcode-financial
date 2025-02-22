
import { Payment } from "@/types/payment";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditableCell } from "@/components/EditableCell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface PaymentTableProps {
  payments: Array<Payment & { clients?: { name: string } }>;
}

export const PaymentTable = ({ payments }: PaymentTableProps) => {
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'overdue':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      case 'billed':
        return 'bg-blue-500';
      case 'awaiting_invoice':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
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
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o pagamento.",
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Atrasado';
      case 'cancelled':
        return 'Cancelado';
      case 'billed':
        return 'Faturado';
      case 'awaiting_invoice':
        return 'Aguardando Fatura';
      default:
        return status;
    }
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
            <TableHead>Método</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
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
                <EditableCell
                  value={payment.due_date}
                  onChange={(value) => handleUpdatePayment(payment.id, 'due_date', value)}
                  type="date"
                />
              </TableCell>
              <TableCell>
                <Select
                  value={payment.payment_method}
                  onValueChange={(value: Payment['payment_method']) => 
                    handleUpdatePayment(payment.id, 'payment_method', value)
                  }
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
                  onValueChange={(value: Payment['status']) => 
                    handleUpdatePayment(payment.id, 'status', value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <Badge className={getStatusColor(payment.status)}>
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
