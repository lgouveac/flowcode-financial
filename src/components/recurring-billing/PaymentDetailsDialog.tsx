import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RecurringBilling } from "@/types/billing";
import { EmailTemplate } from "@/types/email";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Payment } from "@/types/payment";
import { EditablePaymentTable } from "../payments/EditablePaymentTable";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  templates = []
}: PaymentDetailsDialogProps) => {
  const [description, setDescription] = useState(billing.description);
  const [amount, setAmount] = useState(billing.amount.toString());
  const [dueDay, setDueDay] = useState(billing.due_day.toString());
  const [paymentMethod, setPaymentMethod] = useState(billing.payment_method);
  const [status, setStatus] = useState(billing.status);
  const [paymentDate, setPaymentDate] = useState(billing.payment_date || "");
  const [emailTemplate, setEmailTemplate] = useState(billing.email_template || "none");
  const [relatedPayments, setRelatedPayments] = useState<Payment[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [startDate, setStartDate] = useState(billing.start_date);
  const [endDate, setEndDate] = useState(billing.end_date || "");
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [currentInstallment, setCurrentInstallment] = useState(billing.current_installment.toString());
  const [installments, setInstallments] = useState(billing.installments.toString());
  const [additionalInstallments, setAdditionalInstallments] = useState("1");
  const [isAddingInstallments, setIsAddingInstallments] = useState(false);
  const [payOnDelivery, setPayOnDelivery] = useState(false);
  const [newInstallmentsPayOnDelivery, setNewInstallmentsPayOnDelivery] = useState(false);
  const [newInstallmentAmount, setNewInstallmentAmount] = useState("");
  useEffect(() => {
    if (open) {
      setDescription(billing.description);
      setAmount(billing.amount.toString());
      setDueDay(billing.due_day.toString());
      setPaymentMethod(billing.payment_method);
      setStatus(billing.status);
      setPaymentDate(billing.payment_date || "");
      setEmailTemplate(billing.email_template || "none");
      setStartDate(billing.start_date);
      setEndDate(billing.end_date || "");
      setCurrentInstallment(billing.current_installment.toString());
      setInstallments(billing.installments.toString());
      fetchRelatedPayments();
    }
  }, [open, billing]);
  const fetchRelatedPayments = async () => {
    setIsLoadingPayments(true);
    try {
      // Buscar todos os pagamentos relacionados a esta cobrança recorrente
      // com base no client_id e descrição similar (sem a parte da parcela)
      const baseDescription = billing.description;
      const {
        data,
        error
      } = await supabase.from('payments').select('*, clients(*)').eq('client_id', billing.client_id).like('description', `${baseDescription}%`).order('due_date', {
        ascending: true
      });
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
    if (!dateString) return "";
    try {
      // Parse a string date to a Date object
      const date = parseISO(dateString);

      // Check if the date is valid before formatting
      if (!isValid(date)) {
        console.error("Invalid date:", dateString);
        return "";
      }
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };
  const addInstallments = async () => {
    setIsAddingInstallments(true);
    try {
      const additionalCount = parseInt(additionalInstallments);
      if (isNaN(additionalCount) || additionalCount < 1) {
        throw new Error("Número de parcelas a adicionar deve ser maior que 0");
      }

      // Usar o número real de pagamentos existentes como base
      const currentPaymentCount = relatedPayments.length;
      const newTotalInstallments = currentPaymentCount + additionalCount;
      console.log("Pagamentos existentes:", currentPaymentCount);
      console.log("Adicionando:", additionalCount);
      console.log("Novo total:", newTotalInstallments);

      // Encontrar a última data de vencimento dos pagamentos existentes
      const lastPayment = relatedPayments.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())[0];
      let nextDueDate: Date;
      if (lastPayment) {
        nextDueDate = new Date(lastPayment.due_date);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      } else {
        // Fallback: usar a data de início e o dia de vencimento
        const baseDate = new Date(startDate);
        nextDueDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), parseInt(dueDay));
        if (nextDueDate < baseDate) {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }
      }

      // Extrair a descrição base (sem numeração de parcela)
      const baseDescription = description.replace(/\s*\(\d+\/\d+\)$/, '');

      // Criar as novas parcelas com valores individuais
      const newPayments = [];
      for (let i = 1; i <= additionalCount; i++) {
        const installmentNumber = currentPaymentCount + i;
        const installmentAmount = newInstallmentAmount ? parseFloat(newInstallmentAmount) : parseFloat(amount);
        newPayments.push({
          client_id: billing.client_id,
          description: `${baseDescription} (${installmentNumber}/${newTotalInstallments})`,
          amount: installmentAmount, // Valor customizável ou valor padrão
          due_date: nextDueDate.toISOString().split('T')[0],
          payment_method: paymentMethod,
          status: 'pending' as const,
          installment_number: installmentNumber,
          total_installments: newTotalInstallments,
          Pagamento_Por_Entrega: newInstallmentsPayOnDelivery
        });

        // Próximo mês
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      // Inserir os novos pagamentos no banco
      const {
        error: paymentsError
      } = await supabase.from('payments').insert(newPayments);
      if (paymentsError) throw paymentsError;

      // Atualizar o total de parcelas no billing imediatamente no banco
      const {
        error: billingError
      } = await supabase.from('recurring_billing').update({
        installments: newTotalInstallments,
        updated_at: new Date().toISOString()
      }).eq('id', billing.id);
      if (billingError) throw billingError;

      // Atualizar também as descrições dos pagamentos existentes para refletir o novo total
      const updatePromises = relatedPayments.map((payment, index) => {
        const installmentNumber = index + 1;
        const newDescription = `${baseDescription} (${installmentNumber}/${newTotalInstallments})`;
        return supabase.from('payments').update({
          description: newDescription,
          total_installments: newTotalInstallments
        }).eq('id', payment.id);
      });
      await Promise.all(updatePromises);

      // Atualizar o estado local
      setInstallments(newTotalInstallments.toString());
      toast({
        title: "Parcelas adicionadas",
        description: `${additionalCount} parcelas foram adicionadas com sucesso. Total agora: ${newTotalInstallments}`
      });

      // Recarregar os pagamentos para mostrar as novas parcelas
      await fetchRelatedPayments();

      // Chamar onUpdate para atualizar a lista principal
      onUpdate();
      setAdditionalInstallments("1");
      setNewInstallmentAmount("");
    } catch (error) {
      console.error("Erro ao adicionar parcelas:", error);
      toast({
        title: "Erro ao adicionar parcelas",
        description: error instanceof Error ? error.message : "Não foi possível adicionar as parcelas.",
        variant: "destructive"
      });
    } finally {
      setIsAddingInstallments(false);
    }
  };
  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const newDueDay = parseInt(dueDay);
      if (isNaN(newDueDay) || newDueDay < 1 || newDueDay > 31) {
        throw new Error("Dia de vencimento inválido");
      }
      const newCurrentInstallment = parseInt(currentInstallment);
      const newInstallments = parseInt(installments);
      if (isNaN(newCurrentInstallment) || newCurrentInstallment < 1) {
        throw new Error("Parcela atual deve ser maior que 0");
      }
      if (isNaN(newInstallments) || newInstallments < 1) {
        throw new Error("Total de parcelas deve ser maior que 0");
      }

      // Validar payment_date se status for 'paid' (exceto quando for Pagamento por entrega)
      if (status === 'paid' && !paymentDate && !payOnDelivery) {
        throw new Error("Informe a data de pagamento ou marque 'Pagamento por entrega' ao definir como Pago");
      }
      const updateData = {
        description,
        amount: parseFloat(amount),
        due_day: newDueDay,
        payment_method: paymentMethod,
        status,
        payment_date: paymentDate || null,
        email_template: emailTemplate === "none" ? null : emailTemplate,
        start_date: startDate,
        end_date: endDate || null,
        current_installment: newCurrentInstallment,
        installments: newInstallments
      };

      // Verifica se o dia de vencimento foi alterado
      const dueDayChanged = newDueDay !== billing.due_day;

      // Atualiza a cobrança recorrente
      const {
        error
      } = await supabase.from('recurring_billing').update(updateData).eq('id', billing.id);
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
        description: error instanceof Error ? error.message : "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  const updateFuturePaymentDueDates = async (newDueDay: number) => {
    try {
      // Filtra apenas pagamentos futuros que não foram pagos ou cancelados
      const futurePayments = relatedPayments.filter(payment => new Date(payment.due_date) >= new Date() && ['pending', 'overdue', 'billed', 'awaiting_invoice', 'partially_paid'].includes(payment.status));
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
        const {
          error
        } = await supabase.from('payments').update({
          due_date: newDueDate.toISOString().split('T')[0]
        }).eq('id', payment.id);
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
  return <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Recebimento Recorrente</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="informacoes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="informacoes">Informações</TabsTrigger>
            <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="informacoes" className="space-y-4 mt-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Valor</label>
              <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Dia de Vencimento</label>
              <Input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Total de Parcelas</label>
              <Input type="number" min="1" value={installments} onChange={e => setInstallments(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Parcela Atual</label>
              <Input type="number" min="1" value={currentInstallment} onChange={e => setCurrentInstallment(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Data de Início</label>
              <Input type="date" value={formatDate(startDate)} onChange={e => setStartDate(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Data de Término (opcional)</label>
              <Input type="date" value={endDate ? formatDate(endDate) : ""} onChange={e => setEndDate(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Método de Pagamento</label>
              <Select value={paymentMethod} onValueChange={(value: "pix" | "boleto" | "credit_card") => setPaymentMethod(value)}>
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
              <label className="text-sm font-medium">Template de Email</label>
              <Select value={emailTemplate} onValueChange={(value: string) => setEmailTemplate(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {templates.map(template => <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-md font-medium mb-3">Adicionar Parcelas</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div>
                    <label className="text-sm font-medium">Qtd. de Parcelas</label>
                    <Input type="number" min="1" value={additionalInstallments} onChange={e => setAdditionalInstallments(e.target.value)} placeholder="Número de parcelas" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Valor (opcional)</label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={newInstallmentAmount} 
                      onChange={e => setNewInstallmentAmount(e.target.value)} 
                      placeholder={`Padrão: ${amount}`} 
                    />
                  </div>
                  <Button onClick={addInstallments} disabled={isAddingInstallments} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {isAddingInstallments ? "Adicionando..." : "Adicionar"}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="new_installments_pay_on_delivery"
                    checked={newInstallmentsPayOnDelivery}
                    onCheckedChange={(checked) => setNewInstallmentsPayOnDelivery(Boolean(checked))}
                  />
                  <label htmlFor="new_installments_pay_on_delivery" className="text-sm">Marcar novas parcelas como Pagamento por entrega</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="parcelas" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Parcelas</h3>
              <Badge variant="outline" className="px-2 py-1">
                {parseInt(currentInstallment)}/{parseInt(installments)}
              </Badge>
            </div>
            
            {isLoadingPayments ? <div className="flex justify-center items-center h-64">
                <p>Carregando parcelas...</p>
              </div> : relatedPayments.length > 0 ? <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                <EditablePaymentTable payments={relatedPayments} onRefresh={fetchRelatedPayments} />
              </div> : <div className="flex justify-center items-center h-64 border rounded-lg">
                <p className="text-muted-foreground">Nenhuma parcela encontrada</p>
              </div>}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>;
};