import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RecurringBilling } from "@/types/billing";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditableCell } from "@/components/EditableCell";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { PaymentDetailsDialog } from "./PaymentDetailsDialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface BillingTableProps {
  billings: Array<RecurringBilling & { clients?: { name: string } }>;
  onRefresh?: () => void;
}

export const BillingTable = ({ billings, onRefresh }: BillingTableProps) => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RecurringBilling['status'] | 'all'>('all');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteRestricted, setShowDeleteRestricted] = useState(false);
  const [restrictedMessage, setRestrictedMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    billingId: string;
    field: string;
    value: any;
  } | null>(null);
  const [selectedBillingId, setSelectedBillingId] = useState<string | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [billingToDelete, setBillingToDelete] = useState<string | null>(null);
  const [showInstallmentConfirm, setShowInstallmentConfirm] = useState(false);
  const [pendingInstallment, setPendingInstallment] = useState<{
    billingId: string;
    currentInstallment: number;
    totalInstallments: number;
  } | null>(null);

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
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error updating billing:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o recebimento.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateInstallments = (billingId: string, currentInstallment: number, totalInstallments: number) => {
    // Validation
    if (totalInstallments < currentInstallment) {
      toast({
        title: "Valor inválido",
        description: "O total de parcelas não pode ser menor que a parcela atual.",
        variant: "destructive",
      });
      return;
    }
    
    // Show confirmation dialog
    setPendingInstallment({ billingId, currentInstallment, totalInstallments });
    setShowInstallmentConfirm(true);
  };

  const confirmInstallmentUpdate = async () => {
    if (!pendingInstallment) return;
    
    try {
      const { error } = await supabase
        .from('recurring_billing')
        .update({ installments: pendingInstallment.totalInstallments })
        .eq('id', pendingInstallment.billingId);

      if (error) throw error;

      toast({
        title: "Total de parcelas atualizado",
        description: "O número total de parcelas foi atualizado com sucesso.",
      });
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error updating installments:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o total de parcelas.",
        variant: "destructive",
      });
    } finally {
      setShowInstallmentConfirm(false);
      setPendingInstallment(null);
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

  const handleDeleteClick = (e: React.MouseEvent, billingId: string) => {
    e.stopPropagation();
    
    // Find the billing to check its status
    const billing = billings.find(b => b.id === billingId);
    
    if (!billing) {
      console.error("Billing not found:", billingId);
      return;
    }
    
    // Check if billing is in a status that cannot be deleted
    if (billing.status === 'paid' || billing.status === 'cancelled') {
      console.log("Cannot delete billing with status:", billing.status);
      
      // Set appropriate message based on status
      const statusName = billing.status === 'paid' ? 'pago' : 'cancelado';
      setRestrictedMessage(`Não é possível excluir um recebimento com status "${statusName}". Altere o status antes de tentar excluir.`);
      
      // Show restricted dialog
      setShowDeleteRestricted(true);
      return;
    }
    
    setBillingToDelete(billingId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!billingToDelete) return;

    try {
      const { error } = await supabase
        .from('recurring_billing')
        .delete()
        .eq('id', billingToDelete);

      if (error) throw error;

      toast({
        title: "Recebimento excluído",
        description: "O recebimento recorrente foi excluído com sucesso.",
      });
      
      // Call the refresh function provided by the parent component
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting billing:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o recebimento.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteConfirm(false);
      setBillingToDelete(null);
    }
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
    
    // Refresh data when dialog is closed (in case changes were made)
    if (onRefresh) {
      onRefresh();
    }
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
            <TableHead>Método</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
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
              <TableCell className="relative">
                <div className="editable-cell flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <EditableCell
                    value={billing.current_installment.toString()}
                    onChange={(value) => {
                      const newValue = parseInt(value);
                      if (isNaN(newValue) || newValue < 1) return;
                      if (newValue > billing.installments) return;
                      handleUpdateBilling(billing.id, 'current_installment', newValue);
                    }}
                    type="number"
                  />
                  <span>/</span>
                  <EditableCell
                    value={billing.installments.toString()}
                    onChange={(value) => {
                      const newValue = parseInt(value);
                      if (isNaN(newValue) || newValue < 1) return;
                      handleUpdateInstallments(billing.id, billing.current_installment, newValue);
                    }}
                    type="number"
                  />
                </div>
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
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDeleteClick(e, billing.id)}
                  className="opacity-50 hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
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

      <AlertDialog open={showInstallmentConfirm} onOpenChange={setShowInstallmentConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração no total de parcelas</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar o total de parcelas para {pendingInstallment?.totalInstallments}?
              Esta ação afetará todos os pagamentos futuros deste recebimento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingInstallment(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmInstallmentUpdate}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este recebimento recorrente?
              Esta ação não pode ser desfeita e pode afetar outros registros relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBillingToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New alert dialog for restricted deletion */}
      <AlertDialog open={showDeleteRestricted} onOpenChange={setShowDeleteRestricted}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Operação não permitida</AlertDialogTitle>
            <AlertDialogDescription>
              {restrictedMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDeleteRestricted(false)}>
              Entendi
            </AlertDialogAction>
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
