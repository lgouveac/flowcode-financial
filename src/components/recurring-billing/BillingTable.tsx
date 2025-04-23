
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RecurringBilling } from "@/types/billing";
import { RecurringBillingRow } from "./RecurringBillingRow";
import { useState } from "react";
import { PaymentDetailsDialog } from "./PaymentDetailsDialog";
import { useToast } from "@/components/ui/use-toast";

interface BillingTableProps {
  billings: Array<RecurringBilling & { clients?: { name: string; responsible_name?: string } }>;
  onRefresh?: () => void;
  enableDuplicate?: boolean;
}

export const BillingTable = ({ billings, onRefresh, enableDuplicate = false }: BillingTableProps) => {
  const [selectedBilling, setSelectedBilling] = useState<RecurringBilling | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const { toast } = useToast();

  const handleOpenDetails = (billing: RecurringBilling) => {
    setSelectedBilling(billing);
    setShowPaymentDetails(true);
  };

  const handleCloseDetails = () => {
    setShowPaymentDetails(false);
    setSelectedBilling(null);
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleDuplicate = (billing: RecurringBilling) => {
    // TODO: Implement duplication logic
    toast({
      title: "Em breve",
      description: "A funcionalidade de duplicar cobrança recorrente será implementada em breve.",
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Parcela</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Dia do Vencimento</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
            {enableDuplicate && <TableHead className="w-[60px] text-right"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {billings.map((billing) => (
            <RecurringBillingRow
              key={billing.id}
              billing={billing}
              onRefresh={onRefresh || (() => {})}
              onOpenDetails={handleOpenDetails}
              onDuplicate={enableDuplicate ? handleDuplicate : undefined}
            />
          ))}
        </TableBody>
      </Table>

      {selectedBilling && (
        <PaymentDetailsDialog
          billing={selectedBilling}
          open={showPaymentDetails}
          onClose={handleCloseDetails}
          onUpdate={onRefresh || (() => {})}
        />
      )}
    </div>
  );
};
