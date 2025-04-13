
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
}

export const PaymentTable = ({ 
  payments = [], 
  onRefresh,
  searchTerm = "",
  statusFilter = "all"
}: PaymentTableProps) => {
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

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      // Check if clients data exists and has a name property
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
    <div className="rounded-md border overflow-hidden">
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px] sm:w-[180px]">Cliente</TableHead>
              <TableHead className="min-w-[120px]">Descrição</TableHead>
              <TableHead className="w-[100px]">Valor</TableHead>
              <TableHead className="w-[110px]">Vencimento</TableHead>
              <TableHead className="w-[90px] hidden sm:table-cell">Método</TableHead>
              <TableHead className="w-[90px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => (
              <PaymentRow 
                key={payment.id} 
                payment={payment} 
                onEmailSent={handleEmailSent}
                onPaymentUpdated={handlePaymentUpdated}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
