
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Payment } from "@/types/payment";
import type { EmailTemplate } from "@/types/email";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface PaymentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  payment: Payment;
  templates?: EmailTemplate[];
}

export const PaymentDetailsDialog = ({
  open,
  onClose,
  onUpdate,
  payment,
  templates = [],
}: PaymentDetailsDialogProps) => {
  const [description, setDescription] = useState(payment.description);
  const [amount, setAmount] = useState(payment.amount.toString());
  const [dueDate, setDueDate] = useState(payment.due_date);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "boleto" | "credit_card">(payment.payment_method);
  const [status, setStatus] = useState<"pending" | "paid" | "overdue" | "cancelled" | "billed" | "awaiting_invoice" | "partially_paid">(payment.status);
  const [emailTemplate, setEmailTemplate] = useState<string>(payment.email_template || "");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setDescription(payment.description);
      setAmount(payment.amount.toString());
      setDueDate(payment.due_date);
      setPaymentMethod(payment.payment_method);
      setStatus(payment.status);
      setEmailTemplate(payment.email_template || "");
    }
  }, [open, payment]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd');
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          description,
          amount: parseFloat(amount),
          due_date: dueDate,
          payment_method: paymentMethod,
          status,
          email_template: emailTemplate || null
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Pagamento atualizado",
        description: "As alterações foram salvas com sucesso."
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background">
        <DialogHeader>
          <DialogTitle>Editar Pagamento</DialogTitle>
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
            <label>Data de Vencimento</label>
            <Input
              type="date"
              value={formatDate(dueDate)}
              onChange={(e) => setDueDate(e.target.value)}
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

          <div className="grid gap-2">
            <label>Template de Email</label>
            <Select 
              value={emailTemplate} 
              onValueChange={(value: string) => setEmailTemplate(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
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
