
import { Badge } from "@/components/ui/badge";
import type { Payment } from "@/types/payment";

interface PaymentStatusBadgeProps {
  status: Payment['status'];
}

export const PaymentStatusBadge = ({ status }: PaymentStatusBadgeProps) => {
  const getStatusBadgeVariant = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      case 'partially_paid':
        return 'warning';
      default:
        return 'secondary';
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
      case 'partially_paid':
        return 'Parcialmente Pago';
      default:
        return status;
    }
  };

  return (
    <Badge variant={getStatusBadgeVariant(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
};
