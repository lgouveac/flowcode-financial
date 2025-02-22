
import { Payment } from "@/types/payment";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PaymentTableProps {
  payments: Array<Payment & { clients?: { name: string } }>;
}

export const PaymentTable = ({ payments }: PaymentTableProps) => {
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
      default:
        return 'bg-gray-500';
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
              <TableCell>{payment.description}</TableCell>
              <TableCell>{formatCurrency(payment.amount)}</TableCell>
              <TableCell>
                {format(new Date(payment.due_date), "dd 'de' MMMM", { locale: ptBR })}
              </TableCell>
              <TableCell className="capitalize">
                {payment.payment_method.replace('_', ' ')}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(payment.status)}>
                  {payment.status === 'paid' && 'Pago'}
                  {payment.status === 'pending' && 'Pendente'}
                  {payment.status === 'overdue' && 'Atrasado'}
                  {payment.status === 'cancelled' && 'Cancelado'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
