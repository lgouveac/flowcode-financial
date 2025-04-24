
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { RecurringBilling } from "@/types/billing";
import type { Payment } from "@/types/payment";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { PaymentStatusBadge } from "../payments/PaymentStatusBadge";

interface PaymentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  billing: RecurringBilling;
}

export const PaymentDetailsDialog = ({
  open,
  onClose,
  onUpdate,
  billing,
}: PaymentDetailsDialogProps) => {
  const [description, setDescription] = useState(billing.description);
  const [amount, setAmount] = useState(billing.amount.toString());
  const [dueDay, setDueDay] = useState(billing.due_day.toString());
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "boleto" | "credit_card">(billing.payment_method);
  const [status, setStatus] = useState<"pending" | "paid" | "overdue" | "cancelled" | "billed" | "awaiting_invoice" | "partially_paid">(billing.status);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setDescription(billing.description);
      setAmount(billing.amount.toString());
      setDueDay(billing.due_day.toString());
      setPaymentMethod(billing.payment_method);
      setStatus(billing.status);
      fetchRelatedPayments();
    }
  }, [open, billing]);

  const fetchRelatedPayments = async () => {
    setLoadingPayments(true);
    try {
      // Query for payments with the same description from the same client
      // This will return all installments of a recurring payment
      const { data, error } = await supabase
        .from("payments")
        .select("*, clients(name)")
        .eq("client_id", billing.client_id)
        .eq("description", billing.description.split(' (')[0])
        .order("due_date", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching related payments:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('recurring_billing')
        .update({
          description,
          amount: parseFloat(amount),
          due_day: parseInt(dueDay),
          payment_method: paymentMethod,
          status,
        })
        .eq('id', billing.id);

      if (error) throw error;

      toast({
        title: "Cobrança atualizada",
        description: "As alterações foram salvas com sucesso."
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating billing:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-background">
        <DialogHeader>
          <DialogTitle>Editar Cobrança Recorrente</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <label>Descrição</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <label>Valor</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label>Dia do Vencimento</label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label>Método de Pagamento</label>
              <Select 
                value={paymentMethod} 
                onValueChange={(value: "pix" | "boleto" | "credit_card") => setPaymentMethod(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label>Status</label>
              <Select 
                value={status} 
                onValueChange={(value: "pending" | "paid" | "overdue" | "cancelled" | "billed" | "awaiting_invoice" | "partially_paid") => setStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="billed">Faturado</SelectItem>
                  <SelectItem value="awaiting_invoice">Aguardando Fatura</SelectItem>
                  <SelectItem value="partially_paid">Parcialmente Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar Alterações
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pagamentos Relacionados</h3>
            {loadingPayments ? (
              <p>Carregando pagamentos...</p>
            ) : payments.length > 0 ? (
              <div className="overflow-auto max-h-[400px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={payment.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum pagamento encontrado para esta cobrança recorrente.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
