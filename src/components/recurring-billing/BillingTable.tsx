
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RecurringBilling } from "@/types/billing";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditableCell } from "@/components/EditableCell";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { PaymentDetailsDialog } from "./PaymentDetailsDialog";

interface BillingTableProps {
  billings: Array<RecurringBilling & { clients?: { name: string } }>;
}

export const BillingTable = ({ billings }: BillingTableProps) => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RecurringBilling['status'] | 'all'>('all');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    billingId: string;
    field: string;
    value: any;
  } | null>(null);
  const [selectedBillingId, setSelectedBillingId] = useState<string | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  const filteredBillings = billings.filter(billing => {
    const matchesSearch = search.toLowerCase() === '' || 
      billing.clients?.name.toLowerCase().includes(search.toLowerCase()) ||
      billing.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || billing.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleUpdateBilling = async (billingId: string, field: string, value: any) => {
    // If it's a status change that needs confirmation
    if (field === 'status' && (value === 'cancelled' || value === 'overdue')) {
      setPendingAction({ billingId, field, value });
      setShowConfirmDialog(true);
      return;
    }

    // Prevent changing status to paid directly
    if (field === 'status' && value === 'paid') {
      toast({
        title: "Operação não permitida",
        description: "O status 'Pago' só pode ser definido na seção de Movimentações.",
        variant: "destructive",
      });
      return;
    }

    const updates: any = { [field]: value };
    
    try {
      const { error } = await supabase
        .from('recurring_billing')
        .update(updates)
        .eq('id', billingId);

      if (error) throw error;

      toast({
        title: "Recebimento atualizado",
        description: "As informações foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error updating billing:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o recebimento.",
        variant: "destructive",
      });
    }
  };

  const confirmUpdate = async () => {
    if (!pendingAction) return;
    
    await handleUpdateBilling(
      pendingAction.billingId,
      pendingAction.field,
      pendingAction.value
    );
    
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const handleRowClick = (billingId: string, e: React.MouseEvent) => {
    // Prevent opening the dialog if clicked on a form element
    if (
      e.target instanceof HTMLInputElement || 
      e.target instanceof HTMLSelectElement ||
      e.target instanceof HTMLButtonElement ||
      (e.target as HTMLElement).closest('.editable-cell') !== null
    ) {
      return;
    }
    
    setSelectedBillingId(billingId);
    setShowPaymentDetails(true);
  };

  const getStatusBadgeVariant = (status: RecurringBilling['status']) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: RecurringBilling['status']) => {
    const statusLabels: Record<RecurringBilling['status'], string> = {
      pending: 'Pendente',
      billed: 'Faturado',
      awaiting_invoice: 'Aguardando Fatura',
      paid: 'Pago',
      overdue: 'Atrasado',
      cancelled: 'Cancelado'
    };
    return statusLabels[status];
  };

  const handleDialogClose = () => {
    setShowPaymentDetails(false);
    setSelectedBillingId(null);
  };

  return (
    <div className="space-y-4 pt-4 pl-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Buscar por cliente ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-[300px]"
        />
        <Select
          value={statusFilter}
          onValueChange={(value: RecurringBilling['status'] | 'all') => setStatusFilter(value)}
        >
          <SelectTrigger className="sm:max-w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="overdue">Atrasado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
            <SelectItem value="billed">Faturado</SelectItem>
            <SelectItem value="awaiting_invoice">Aguardando Fatura</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Parcela</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Dia do Vencimento</TableHead>
            <TableHead>Data Pgto.</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredBillings.map((billing) => (
            <TableRow 
              key={billing.id} 
              className="group hover:bg-muted/50 cursor-pointer"
              onClick={(e) => handleRowClick(billing.id, e)}
            >
              <TableCell>{billing.clients?.name}</TableCell>
              <TableCell className="relative">
                <div className="editable-cell" onClick={(e) => e.stopPropagation()}>
                  <EditableCell
                    value={billing.description}
                    onChange={(value) => handleUpdateBilling(billing.id, 'description', value)}
                  />
                </div>
              </TableCell>
              <TableCell>
                {billing.current_installment}/{billing.installments}
              </TableCell>
              <TableCell className="relative">
                <div className="editable-cell" onClick={(e) => e.stopPropagation()}>
                  <EditableCell
                    value={billing.amount.toString()}
                    onChange={(value) => handleUpdateBilling(billing.id, 'amount', parseFloat(value))}
                    type="number"
                  />
                </div>
              </TableCell>
              <TableCell className="relative">
                <div className="editable-cell" onClick={(e) => e.stopPropagation()}>
                  <EditableCell
                    value={billing.due_day.toString()}
                    onChange={(value) => handleUpdateBilling(billing.id, 'due_day', parseInt(value))}
                    type="number"
                  />
                </div>
              </TableCell>
              <TableCell className="relative">
                <div onClick={(e) => e.stopPropagation()}>
                  <input
                    type="date"
                    value={billing.payment_date || ''}
                    onChange={(e) => handleUpdateBilling(billing.id, 'payment_date', e.target.value)}
                    className={`w-full bg-transparent ${billing.status === 'paid' ? '' : 'opacity-50'}`}
                    disabled={billing.status !== 'paid'}
                  />
                </div>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Select
                  value={billing.payment_method}
                  onValueChange={(value) => handleUpdateBilling(billing.id, 'payment_method', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Select
                  value={billing.status}
                  onValueChange={(value) => handleUpdateBilling(billing.id, 'status', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <Badge variant={getStatusBadgeVariant(billing.status)}>
                        {getStatusLabel(billing.status)}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="billed">Faturado</SelectItem>
                    <SelectItem value="awaiting_invoice">Aguardando Fatura</SelectItem>
                    <SelectItem value="overdue">Atrasado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar o status desta cobrança para 
              {pendingAction?.value === 'cancelled' ? ' cancelada' : ' atrasada'}?
              Esta ação pode ter implicações importantes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAction(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdate}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedBillingId && (
        <PaymentDetailsDialog
          billingId={selectedBillingId}
          open={showPaymentDetails}
          onClose={handleDialogClose}
        />
      )}
    </div>
  );
};
