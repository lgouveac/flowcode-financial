
import React from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Payment } from "@/types/payment";
import { PaymentRow } from "./PaymentRow";
import { EmptyState } from "./EmptyState";

interface PaymentTableProps {
  payments?: Payment[];
  onRefresh?: () => void;
}

export const PaymentTable = ({ payments = [], onRefresh }: PaymentTableProps) => {
  const handleEmailSent = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const handlePaymentUpdated = () => {
    if (onRefresh) {
      onRefresh();
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
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <EmptyState />
          ) : (
            payments.map((payment) => (
              <PaymentRow 
                key={payment.id} 
                payment={payment} 
                onEmailSent={handleEmailSent}
                onPaymentUpdated={handlePaymentUpdated}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
