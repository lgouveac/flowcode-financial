
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RecurringBilling } from "@/types/billing";
import { EmailTemplate } from "@/types/email";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Payment } from "@/types/payment";
import { PaymentTable } from "../payments/PaymentTable";
import { Badge } from "@/components/ui/badge";

interface PaymentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  billing: RecurringBilling;
  templates?: EmailTemplate[];
}

export const PaymentDetailsDialog = ({
  open,
  onClose,
  onUpdate,
  billing,
  templates = [],
}: PaymentDetailsDialogProps) => {
  const [description, setDescription] = useState(billing.description);
  const [amount, setAmount] = useState(billing.amount.toString());
  const [dueDay, setDueDay] = useState(billing.due_day.toString());
  const [paymentMethod, setPaymentMethod] = useState(billing.payment_method);
  const [status, setStatus] = useState(billing.status);
  const [emailTemplate, setEmailTemplate] = useState(billing.email_template || "none");
  const [relatedPayments, setRelatedPayments] = useState<Payment[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [startDate, setStartDate] = useState(billing.start_date);
  const [endDate, setEndDate] = useState(billing.end_date || "");
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  useEffect(() => {
    if (open) {
      setDescription(billing.description);
      setAmount(billing.amount.toString());
      setDueDay(billing.due_day.toString());
      setPaymentMethod(billing.payment_method);
      setStatus(billing.status);
      setEmailTemplate(billing.email_template || "none");
      setStartDate(billing.start_date);
      setEndDate(billing.end_date || "");
      fetchRelatedPayments();
    }
  }, [open, billing]);

  const fetchRelatedPayments = async () => {
    setIsLoadingPayments(true);
    try {
      // Buscar todos os pagamentos relacionados a esta cobrança recorrente
      // com base no client_id e descrição similar (sem a parte da parcela)
      const baseDescription = billing.description;
      
      const { data, error } = await supabase
        .from('payments')
        .select('*, clients(*)')
        .eq('client_id', billing.client_id)
        .like('description', `${baseDescription}%`)
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      setRelatedPayments(data || []);
    } catch (error) {
      console.error("Erro ao buscar pagamentos relacionados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pagamentos relacionados.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd');
  };

  const handleSave = async () => {
    setIsUpdating(true);
    
    try {
      const newDueDay = parseInt(dueDay);
      if (isNaN(newDueDay) || newDueDay < 1 || newDueDay > 31) {
        throw new Error("Dia de vencimento inválido");
      }
      
      const updateData = {
        description,
        amount: parseFloat(amount),
        due_day: newDueDay,
        payment_method: paymentMethod,
        status,
        email_template: emailTemplate === "none" ? null : emailTemplate,
        start_date: startDate,
        end_date: endDate || null
      };
      
      // Verifica se o dia de vencimento foi alterado
      const dueDayChanged = newDueDay !== billing.due_day;
      
      // Atualiza a cobrança recorrente
      const { error } = await supabase
        .from('recurring_billing')
        .update(updateData)
        .eq('id', billing.id);

      if (error) throw error;

      toast({
        title: "Cobrança atualizada",
        description: "As alterações foram salvas com sucesso."
      });

      // Se o dia de vencimento foi alterado, vamos atualizar as datas de vencimento de todos os pagamentos futuros
      if (dueDayChanged) {
        // Atualiza as datas de vencimento dos pagamentos futuros
        await updateFuturePaymentDueDates(newDueDay);
      }

      onUpdate();
      fetchRelatedPayments(); // Recarrega os pagamentos para mostrar as alterações
    } catch (error) {
      console.error("Erro ao atualizar cobrança:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateFuturePaymentDueDates = async (newDueDay: number) => {
    try {
      // Filtra apenas pagamentos futuros que não foram pagos ou cancelados
      const futurePayments = relatedPayments.filter(payment => 
        new Date(payment.due_date) >= new Date() && 
        ['pending', 'overdue', 'billed', 'awaiting_invoice', 'partially_paid'].includes(payment.status)
      );
      
      if (futurePayments.length === 0) return;
      
      let updatedCount = 0;
      
      // Atualiza cada pagamento futuro
      for (const payment of futurePayments) {
        const currentDueDate = new Date(payment.due_date);
        
        // Pega o primeiro dia do mês da data de vencimento atual
        let newDueDate = new Date(currentDueDate.getFullYear(), currentDueDate.getMonth(), 1);
        
        // Adiciona o novo dia de vencimento
        newDueDate.setDate(newDueDay);
        
        // Se o novo dia for maior que o último dia do mês, ajusta para o último dia
        const nextMonth = new Date(currentDueDate.getFullYear(), currentDueDate.getMonth() + 1, 0);
        if (newDueDay > nextMonth.getDate()) {
          newDueDate = nextMonth;
        }
        
        // Atualiza a data de vencimento do pagamento
        const { error } = await supabase
          .from('payments')
          .update({ due_date: newDueDate.toISOString().split('T')[0] })
          .eq('id', payment.id);
          
        if (error) {
          console.error("Erro ao atualizar pagamento:", error);
        } else {
          updatedCount++;
        }
      }
      
      if (updatedCount > 0) {
        toast({
          title: "Datas atualizadas",
          description: `${updatedCount} pagamentos futuros foram atualizados com o novo dia de vencimento.`
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar datas de vencimento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar todas as datas de vencimento.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Recebimento Recorrente</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações da Cobrança</h3>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Valor</label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Dia de Vencimento</label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Data de Início</label>
              <Input
                type="date"
                value={formatDate(startDate)}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Data de Término (opcional)</label>
              <Input
                type="date"
                value={endDate ? formatDate(endDate) : ""}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Método de Pagamento</label>
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
              <label className="text-sm font-medium">Status</label>
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
              <label className="text-sm font-medium">Template de Email</label>
              <Select 
                value={emailTemplate} 
                onValueChange={(value: string) => setEmailTemplate(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {templates.map((template) => (
                    <SelectItem 
                      key={template.id} 
                      value={template.id}
                    >
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isUpdating}
              >
                {isUpdating ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Parcelas</h3>
              <Badge variant="outline" className="px-2 py-1">
                {billing.current_installment}/{billing.installments}
              </Badge>
            </div>
            
            {isLoadingPayments ? (
              <div className="flex justify-center items-center h-64">
                <p>Carregando parcelas...</p>
              </div>
            ) : relatedPayments.length > 0 ? (
              <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                <PaymentTable 
                  payments={relatedPayments}
                  onRefresh={fetchRelatedPayments}
                  templates={templates}
                />
              </div>
            ) : (
              <div className="flex justify-center items-center h-64 border rounded-lg">
                <p className="text-muted-foreground">Nenhuma parcela encontrada</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
