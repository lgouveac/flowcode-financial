
import React from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Payment } from "@/types/payment";
import { formatCurrency, formatDate, getStatusBadge } from "./utils.tsx";

interface PaymentsTableSectionProps {
  payments: Payment[];
  onStatusChange: (paymentId: string, newStatus: string) => void;
  isUpdating: boolean;
}

export const PaymentsTableSection: React.FC<PaymentsTableSectionProps> = ({
  payments,
  onStatusChange,
  isUpdating
}) => {
  return (
    <div className="border-t border-border/50 pt-4">
      <h3 className="text-lg font-medium mb-4">Pagamentos Associados</h3>
      
      {payments.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pago em</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.description}</TableCell>
                <TableCell>{formatDate(payment.due_date)}</TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                <TableCell>{payment.payment_date ? formatDate(payment.payment_date) : '-'}</TableCell>
                <TableCell>
                  {payment.status !== 'paid' && payment.status !== 'cancelled' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onStatusChange(payment.id, 'paid')}
                      disabled={isUpdating}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      Marcar como pago
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          Nenhum pagamento associado encontrado.
        </div>
      )}
    </div>
  );
};
