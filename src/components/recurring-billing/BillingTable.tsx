
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

  return (
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
                  value={billing.due_date}
                  onChange={(value) => handleUpdateBilling(billing.id, 'due_date', value)}
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
                      <Badge variant={billing.status === 'active' ? 'default' : 'secondary'}>
                        {billing.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
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
