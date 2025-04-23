
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
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setDescription(billing.description);
      setAmount(billing.amount.toString());
      setDueDay(billing.due_day.toString());
      setPaymentMethod(billing.payment_method);
      setStatus(billing.status);
    }
  }, [open, billing]);

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Cobrança Recorrente</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
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
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
