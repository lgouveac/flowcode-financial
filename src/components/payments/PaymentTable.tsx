
import React, { useMemo } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Payment } from "@/types/payment";
import { PaymentRow } from "./PaymentRow";
import { EmptyState } from "./EmptyState";

interface PaymentTableProps {
  payments?: Payment[];
  onRefresh?: () => void;
  searchTerm?: string;
  statusFilter?: string;
  enableDuplicate?: boolean;
}

export const PaymentTable = ({ 
  payments = [], 
  onRefresh,
  searchTerm = "",
  statusFilter = "all",
  enableDuplicate = false
}: PaymentTableProps) => {
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const clientName = payment.clients?.name || '';
      const matchesSearch = 
        searchTerm.toLowerCase() === '' || 
        clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = 
        statusFilter === 'all' || 
        payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  if (filteredPayments.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="overflow-x-auto">
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
            {filteredPayments.map((payment) => (
              <PaymentRow 
                key={payment.id}
                payment={payment} 
                onEmailSent={() => onRefresh?.()}
                onPaymentUpdated={() => onRefresh?.()}
                enableDuplicate={enableDuplicate}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
