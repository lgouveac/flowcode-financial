
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [emailTemplate, setEmailTemplate] = useState<string>(payment.email_template || "none");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setDescription(payment.description);
      setAmount(payment.amount.toString());
      setDueDate(payment.due_date);
      setPaymentMethod(payment.payment_method);
      setStatus(payment.status);
      setEmailTemplate(payment.email_template || "none");
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
          email_template: emailTemplate === "none" ? null : emailTemplate
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
      <DialogContent className="max-w-md bg-[#0a0c10] border-[#1e2030] text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white">Editar Pagamento</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm text-gray-300">Descrição</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#151820] border-[#2a2f3d] text-white"
            />
          </div>
          
          <div className="grid gap-2">
            <label className="text-sm text-gray-300">Valor</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-[#151820] border-[#2a2f3d] text-white"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-gray-300">Data de Vencimento</label>
            <Input
              type="date"
              value={formatDate(dueDate)}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-[#151820] border-[#2a2f3d] text-white"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-gray-300">Método de Pagamento</label>
            <Select 
              value={paymentMethod} 
              onValueChange={(value: "pix" | "boleto" | "credit_card") => setPaymentMethod(value)}
            >
              <SelectTrigger className="bg-[#151820] border-[#2a2f3d] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#151820] border-[#2a2f3d] text-white">
                <SelectItem value="pix" className="text-gray-100 focus:bg-[#2a2f3d] focus:text-white">PIX</SelectItem>
                <SelectItem value="boleto" className="text-gray-100 focus:bg-[#2a2f3d] focus:text-white">Boleto</SelectItem>
                <SelectItem value="credit_card" className="text-gray-100 focus:bg-[#2a2f3d] focus:text-white">Cartão de Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-gray-300">Status</label>
            <Select 
              value={status} 
              onValueChange={(value: "pending" | "paid" | "overdue" | "cancelled" | "billed" | "awaiting_invoice" | "partially_paid") => setStatus(value)}
            >
              <SelectTrigger className="bg-[#151820] border-[#2a2f3d] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#151820] border-[#2a2f3d] text-white">
                <SelectItem value="pending" className="text-gray-100 focus:bg-[#2a2f3d] focus:text-white">Pendente</SelectItem>
                <SelectItem value="paid" className="text-gray-100 focus:bg-[#2a2f3d] focus:text-white">Pago</SelectItem>
                <SelectItem value="overdue" className="text-gray-100 focus:bg-[#2a2f3d] focus:text-white">Atrasado</SelectItem>
                <SelectItem value="cancelled" className="text-gray-100 focus:bg-[#2a2f3d] focus:text-white">Cancelado</SelectItem>
                <SelectItem value="billed" className="text-gray-100 focus:bg-[#2a2f3d] focus:text-white">Faturado</SelectItem>
                <SelectItem value="awaiting_invoice" className="text-gray-100 focus:bg-[#2a2f3d] focus:text-white">Aguardando Fatura</SelectItem>
                <SelectItem value="partially_paid" className="text-gray-100 focus:bg-[#2a2f3d] focus:text-white">Parcialmente Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-gray-300">Template de Email</label>
            <Select 
              value={emailTemplate} 
              onValueChange={(value: string) => setEmailTemplate(value)}
            >
              <SelectTrigger className="bg-[#151820] border-[#2a2f3d] text-white">
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent className="bg-[#151820] border-[#2a2f3d] text-white">
                <SelectItem value="none" className="text-gray-100 focus:bg-[#2a2f3d] focus:text-white">Nenhum</SelectItem>
                {templates.map((template) => (
                  <SelectItem 
                    key={template.id} 
                    value={template.id}
                    className="text-gray-100 focus:bg-[#2a2f3d] focus:text-white"
                  >
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-transparent border-[#2a2f3d] text-gray-300 hover:bg-[#2a2f3d] hover:text-white"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
          >
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
