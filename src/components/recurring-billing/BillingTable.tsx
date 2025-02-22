
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RecurringBilling } from "@/types/billing";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditableCell } from "@/components/EditableCell";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface BillingTableProps {
  billings: Array<RecurringBilling & { clients?: { name: string } }>;
}

export const BillingTable = ({ billings }: BillingTableProps) => {
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleUpdateBilling = async (billingId: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('recurring_billing')
        .update({ [field]: value })
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {billings.map((billing) => (
            <TableRow key={billing.id} className="group">
              <TableCell>{billing.clients?.name}</TableCell>
              <TableCell className="relative">
                <EditableCell
                  value={billing.description}
                  onChange={(value) => handleUpdateBilling(billing.id, 'description', value)}
                />
              </TableCell>
              <TableCell className="relative">
                <EditableCell
                  value={billing.amount.toString()}
                  onChange={(value) => handleUpdateBilling(billing.id, 'amount', parseFloat(value))}
                  type="number"
                />
              </TableCell>
              <TableCell className="relative">
                <EditableCell
                  value={billing.due_day.toString()}
                  onChange={(value) => handleUpdateBilling(billing.id, 'due_day', parseInt(value))}
                  type="number"
                />
              </TableCell>
              <TableCell>
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
              <TableCell>
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
                    <SelectItem value="paid">Pago</SelectItem>
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
  );
};
