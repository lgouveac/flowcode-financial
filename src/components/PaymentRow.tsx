
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import type { Payment } from "@/types/payment";
import { format } from "date-fns";
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
  isRecurring?: boolean;
}

export const PaymentRow = ({ 
  payment, 
  onEmailSent, 
  onPaymentUpdated, 
  enableDuplicate = false,
  templates = [],
  isRecurring = false
}: PaymentRowProps) => {
  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>{payment.clients?.name}</TableCell>
      <TableCell>{isRecurring ? `${payment.description} (Recorrente)` : payment.description}</TableCell>
      <TableCell>{formatCurrency(payment.amount)}</TableCell>
      <TableCell>
        {format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: ptBR })}
      </TableCell>
      <TableCell>{payment.payment_method.toUpperCase()}</TableCell>
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
