
import React, { useMemo, useState } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Payment } from "@/types/payment";
import { PaymentRow } from "./PaymentRow";
import { EmptyState } from "./EmptyState";
import { EmailTemplate } from "@/types/email";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/utils/formatters";
import { Trash2, CheckSquare, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [selectedPayments, setSelectedPayments] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      // Filtrar pagamentos sem data de vencimento
      if (!payment.due_date) {
        return false;
      }
      
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

  // Funções para seleção em lote
  const handleSelectPayment = (paymentId: number, checked: boolean) => {
    const newSelected = new Set(selectedPayments);
    if (checked) {
      newSelected.add(paymentId);
    } else {
      newSelected.delete(paymentId);
    }
    setSelectedPayments(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredPayments.map(p => p.id));
      setSelectedPayments(allIds);
    } else {
      setSelectedPayments(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPayments.size === 0) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja deletar ${selectedPayments.size} recebimento(s) selecionado(s)?`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .in('id', Array.from(selectedPayments));

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${selectedPayments.size} recebimento(s) deletado(s) com sucesso.`,
      });

      setSelectedPayments(new Set());
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Erro ao deletar recebimentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar os recebimentos selecionados.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isAllSelected = filteredPayments.length > 0 &&
    filteredPayments.every(payment => selectedPayments.has(payment.id));
  const isPartiallySelected = selectedPayments.size > 0 && !isAllSelected;

  if (filteredPayments.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Barra de ações em lote */}
      {selectedPayments.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
          <span className="text-sm font-medium">
            {selectedPayments.size} recebimento(s) selecionado(s)
          </span>
          <Button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? "Deletando..." : "Deletar Selecionados"}
          </Button>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <div className="min-w-[700px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    indeterminate={isPartiallySelected}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
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
                    isSelected={selectedPayments.has(payment.id)}
                    onSelectChange={handleSelectPayment}
                  />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
