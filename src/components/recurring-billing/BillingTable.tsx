
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RecurringBilling } from "@/types/billing";
import { RecurringBillingRow } from "./RecurringBillingRow";
import { useState } from "react";
import { PaymentDetailsDialog } from "./PaymentDetailsDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EmailTemplate } from "@/types/email";
import { EmptyState } from "../payments/EmptyState";

interface BillingTableProps {
  billings: Array<RecurringBilling & { clients?: { name: string; responsible_name?: string } }>;
  onRefresh?: () => void;
  enableDuplicate?: boolean;
  templates?: EmailTemplate[];
}

export const BillingTable = ({ billings, onRefresh, enableDuplicate, templates = [] }: BillingTableProps) => {
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
    // Removed automatic onRefresh call to prevent unnecessary refreshes
  };

  const handleUpdateFromModal = () => {
    // Only refresh when there's an actual update from the modal
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleDuplicate = async (billing: RecurringBilling): Promise<void> => {
    try {
      const newBilling = {
        client_id: billing.client_id,
        description: `${billing.description} (Cópia)`,
        amount: billing.amount,
        due_day: billing.due_day,
        payment_method: billing.payment_method,
        start_date: billing.start_date,
        end_date: billing.end_date,
        status: 'pending' as const,
        installments: billing.installments,
        current_installment: 1,
        email_template: billing.email_template
      };

      const { data, error } = await supabase
        .from('recurring_billing')
        .insert([newBilling])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Cobrança duplicada",
        description: "A cobrança recorrente foi duplicada com sucesso."
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Erro ao duplicar cobrança:", error);
      toast({
        title: "Erro ao duplicar",
        description: "Não foi possível duplicar a cobrança.",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  if (billings.length === 0) {
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
            <TableHead>Status</TableHead>
            <TableHead>Parcela</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {billings.map((billing) => (
            <RecurringBillingRow
              key={billing.id}
              billing={billing}
              onRefresh={onRefresh || (() => {})}
              onOpenDetails={handleOpenDetails}
              onDuplicate={handleDuplicate}
              enableDuplicate={enableDuplicate}
              templates={templates}
            />
          ))}
        </TableBody>
      </Table>

      {selectedBilling && (
        <PaymentDetailsDialog
          billing={selectedBilling}
          open={showPaymentDetails}
          onClose={handleCloseDetails}
          onUpdate={handleUpdateFromModal}
          templates={templates}
        />
      )}
    </div>
  );
};
