
import React, { useMemo } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Payment } from "@/types/payment";
import { PaymentRow } from "./PaymentRow";
import { EmptyState } from "./EmptyState";
import { EmailTemplate } from "@/types/email";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";

interface PaymentTableProps {
  payments?: Payment[];
  onRefresh?: () => void;
  searchTerm?: string;
  statusFilter?: string;
  enableDuplicate?: boolean;
  templates?: EmailTemplate[];
}

export const PaymentTable = ({ 
  payments = [], 
  onRefresh,
  searchTerm = "",
  statusFilter = "all",
  enableDuplicate = false,
  templates = []
}: PaymentTableProps) => {
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const clientName = payment.clients?.name || '';
      const description = payment.description?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      
      // Search filtering
      const matchesSearch = 
        searchTerm === '' || 
        clientName.toLowerCase().includes(searchLower) ||
        description.includes(searchLower);
      
      // Status filtering
      const matchesStatus = 
        statusFilter === 'all' || 
        payment.status === statusFilter;
        
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);


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

  if (filteredPayments.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <div className="min-w-[700px]">
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
              onEmailSent={handleEmailSent}
              onPaymentUpdated={handlePaymentUpdated}
              enableDuplicate={enableDuplicate}
              templates={templates}
            />
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
};
