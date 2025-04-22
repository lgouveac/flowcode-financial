
import React, { useMemo } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Payment } from "@/types/payment";
import { PaymentRow } from "./PaymentRow";
import { EmptyState } from "./EmptyState";
import { Button } from "@/components/ui/button";
import { Plus, Copy } from "lucide-react";

interface PaymentTableProps {
  payments?: Payment[];
  onRefresh?: () => void;
  searchTerm?: string;
  statusFilter?: string;
  enableDuplicate?: boolean; // novo prop
}

export const PaymentTable = ({ 
  payments = [], 
  onRefresh,
  searchTerm = "",
  statusFilter = "all",
  enableDuplicate = false // default
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

  const handleDuplicate = (payment: Payment) => {
    // Trigger uma função para duplicar pagamento (exemplo: abrir dialog de novo pagamento já preenchido)
    alert("Duplicar funcionalidade ainda não implementada! Mas será possível aqui duplicar recebimento:\n\n" + payment.description);
    // Aqui você poderá abrir um dialog passando os dados
  };

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
              {enableDuplicate && (
                <TableHead className="w-[60px] text-right"></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => (
              <React.Fragment key={payment.id}>
                <PaymentRow 
                  payment={payment} 
                  onEmailSent={handleEmailSent}
                  onPaymentUpdated={handlePaymentUpdated}
                />
                {enableDuplicate && (
                  <TableRow>
                    <td colSpan={7}></td>
                    <td className="text-right pr-4">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Duplicar recebimento"
                        onClick={() => handleDuplicate(payment)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </td>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
