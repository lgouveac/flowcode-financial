
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import type { Payment } from "@/types/payment";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { PaymentActions } from "./PaymentActions";
import { formatCurrency } from "@/utils/formatters";
import type { EmailTemplate } from "@/types/email";

interface PaymentRowProps {
  payment: Payment;
  onEmailSent: () => void;
  onPaymentUpdated: () => void;
  enableDuplicate?: boolean;
  templates?: EmailTemplate[];
  hideClientName?: boolean;
}

export const PaymentRow = ({ 
  payment, 
  onEmailSent, 
  onPaymentUpdated, 
  enableDuplicate = false,
  templates = [],
  hideClientName = false
}: PaymentRowProps) => {
  // Format due date safely without timezone conversion
  const formattedDueDate = payment.due_date 
    ? format(parseISO(payment.due_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
    : 'Data não definida';
    
  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="line-clamp-2 text-sm leading-5 max-h-10 overflow-hidden" title={payment.clients?.name || 'Cliente não encontrado'}>
          {payment.clients?.name || 'Cliente não encontrado'}
        </div>
      </TableCell>
      <TableCell>
        <div className="line-clamp-2 text-sm leading-5 max-h-10 overflow-hidden" title={payment.description || 'Sem descrição'}>
          {payment.description || 'Sem descrição'}
        </div>
      </TableCell>
      <TableCell>{formatCurrency(payment.amount)}</TableCell>
      <TableCell>{formattedDueDate}</TableCell>
      <TableCell>{(payment.payment_method || '').toUpperCase()}</TableCell>
      <TableCell>
        <PaymentStatusBadge status={payment.status} />
      </TableCell>
      <TableCell>
        <PaymentActions
          payment={payment}
          onPaymentUpdated={onPaymentUpdated}
          enableDuplicate={enableDuplicate}
          templates={templates}
        />
      </TableCell>
    </TableRow>
  );
};
