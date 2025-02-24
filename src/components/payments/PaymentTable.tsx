import { Payment } from "@/types/payment";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EditableCell } from "@/components/EditableCell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";

interface PaymentTableProps {
  payments: Array<Payment & { clients?: { name: string } }>;
}

export const PaymentTable = ({ payments }: PaymentTableProps) => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Payment['status'] | 'all'>('all');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    paymentId: string;
    field: string;
    value: any;
  } | null>(null);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = search.toLowerCase() === '' || 
      payment.clients?.name.toLowerCase().includes(search.toLowerCase()) ||
      payment.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleUpdatePayment = async (paymentId: string, field: string, value: any) => {
    // If it's a status change that needs confirmation
    if (field === 'status' && (value === 'cancelled' || value === 'overdue')) {
      setPendingAction({ paymentId, field, value });
      setShowConfirmDialog(true);
      return;
    }

    try {
      const { error } = await supabase
        .from('payments')
        .update({ [field]: value })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Pagamento atualizado",
        description: "As informações foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o pagamento.",
        variant: "destructive",
      });
    }
  };

  const confirmUpdate = async () => {
    if (!pendingAction) return;
    
    await handleUpdatePayment(
      pendingAction.paymentId,
      pendingAction.field,
      pendingAction.value
    );
    
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'overdue':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      case 'billed':
        return 'bg-blue-500';
      case 'awaiting_invoice':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Atrasado';
      case 'cancelled':
        return 'Cancelado';
      case 'billed':
        return 'Faturado';
      case 'awaiting_invoice':
        return 'Aguardando Fatura';
      default:
        return status;
    }
  };

  // Sort payments by creation date (newest first), then by installment number
  const sortedPayments = [...payments].sort((a, b) => {
    // First sort by created_at (newest first)
    const dateComparison = new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    if (dateComparison !== 0) return dateComparison;
    
    // Then sort by installment number if they're from the same batch
    if (a.total_installments && b.total_installments) {
      return (a.installment_number || 0) - (b.installment_number || 0);
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Buscar por cliente ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-[300px]"
        />
        <Select
          value={statusFilter}
          onValueChange={(value: Payment['status'] | 'all') => setStatusFilter(value)}
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment, index) => (
              <TableRow 
                key={payment.id}
                className={`group ${
                  // Add a visual separator between different payment groups
                  index > 0 &&
                  filteredPayments[index - 1]?.total_installments !== payment.total_installments &&
                  "border-t-4 border-t-gray-200"
                }`}
              >
                <TableCell>{payment.clients?.name}</TableCell>
                <TableCell className="relative">
                  <EditableCell
                    value={payment.description}
                    onChange={(value) => handleUpdatePayment(payment.id, 'description', value)}
                  />
                </TableCell>
                <TableCell className="relative">
                  <EditableCell
                    value={payment.amount.toString()}
                    onChange={(value) => handleUpdatePayment(payment.id, 'amount', parseFloat(value))}
                    type="number"
                  />
                </TableCell>
                <TableCell className="relative">
                  <EditableCell
                    value={payment.due_date}
                    onChange={(value) => handleUpdatePayment(payment.id, 'due_date', value)}
                    type="date"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={payment.payment_method}
                    onValueChange={(value: Payment['payment_method']) => 
                      handleUpdatePayment(payment.id, 'payment_method', value)
                    }
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
                <TableCell>
                  <Select
                    value={payment.status}
                    onValueChange={(value: Payment['status']) => 
                      handleUpdatePayment(payment.id, 'status', value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        <Badge className={getStatusColor(payment.status)}>
                          {getStatusLabel(payment.status)}
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
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar o status deste pagamento para 
              {pendingAction?.value === 'cancelled' ? ' cancelado' : ' atrasado'}?
              Esta ação pode ter implicações importantes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAction(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdate}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
