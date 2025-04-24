
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RecurringBilling } from "@/types/billing";
import { RecurringBillingRow } from "./RecurringBillingRow";
import { useState } from "react";
import { PaymentDetailsDialog } from "./PaymentDetailsDialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EmailTemplate } from "@/types/email";

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
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleDuplicate = async (billing: RecurringBilling) => {
    try {
      // Create a new billing object without id and creation dates
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
            <TableHead>Dia do Vencimento</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Status</TableHead>
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
          templates={templates}
        />
      )}
    </div>
  );
};
