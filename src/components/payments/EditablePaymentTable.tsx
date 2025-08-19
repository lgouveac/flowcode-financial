import React from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Payment } from "@/types/payment";
import { EditablePaymentRow } from "./EditablePaymentRow";
import { EmptyState } from "./EmptyState";

interface EditablePaymentTableProps {
  payments?: Payment[];
  onRefresh?: () => void;
}

export const EditablePaymentTable = ({ 
  payments = [], 
  onRefresh
}: EditablePaymentTableProps) => {

  const handlePaymentUpdated = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  if (payments.length === 0) {
    return <EmptyState />;
  }

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
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <EditablePaymentRow 
              key={payment.id}
              payment={payment} 
              onPaymentUpdated={handlePaymentUpdated}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};