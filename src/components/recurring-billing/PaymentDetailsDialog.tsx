
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RecurringBilling } from "@/types/billing";
import { EmailTemplate } from "@/types/email";
import { formatCurrency } from "@/utils/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Copy, Mail, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SendInvoiceDialog } from "./SendInvoiceDialog";

// Define PaymentStatus type locally
type PaymentStatus = 'pending' | 'billed' | 'awaiting_invoice' | 'paid' | 'overdue' | 'cancelled' | 'partially_paid';

interface PaymentDetailsDialogProps {
  billing: RecurringBilling;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  templates?: EmailTemplate[];
}

export const PaymentDetailsDialog = ({ 
  billing, 
  open, 
  onClose, 
  onUpdate, 
  templates = [] 
}: PaymentDetailsDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [openSendInvoice, setOpenSendInvoice] = useState(false);

  // Form fields
  const [status, setStatus] = useState<PaymentStatus>(billing.status as PaymentStatus);
  const [description, setDescription] = useState(billing.description);
  const [amount, setAmount] = useState(billing.amount.toString());
  const [dueDay, setDueDay] = useState(billing.due_day.toString());
  const [installments, setInstallments] = useState(billing.installments.toString());
  const [currentInstallment, setCurrentInstallment] = useState(billing.current_installment.toString());
  const [paymentMethod, setPaymentMethod] = useState(billing.payment_method);
  const [startDate, setStartDate] = useState(billing.start_date);
  const [endDate, setEndDate] = useState(billing.end_date || '');
  const [paymentDate, setPaymentDate] = useState<string | null>(billing.payment_date || null);

  // Reset form when billing changes or dialog opens
  useEffect(() => {
    if (open) {
      setStatus(billing.status as PaymentStatus);
      setDescription(billing.description);
      setAmount(billing.amount.toString());
      setDueDay(billing.due_day.toString());
      setInstallments(billing.installments.toString());
      setCurrentInstallment(billing.current_installment.toString());
      setPaymentMethod(billing.payment_method);
      setStartDate(billing.start_date);
      setEndDate(billing.end_date || '');
      setPaymentDate(billing.payment_date || null);
      setIsEditing(false);
    }
  }, [billing, open]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd', { locale: ptBR });
    } catch (e) {
      return '';
    }
  };

  const handleSaveChanges = async () => {
    try {
      const { error } = await supabase
        .from('recurring_billing')
        .update({
          status,
          description,
          amount: parseFloat(amount),
          due_day: parseInt(dueDay),
          installments: parseInt(installments),
          current_installment: parseInt(currentInstallment),
          payment_method: paymentMethod,
          start_date: startDate,
          end_date: endDate || null,
          payment_date: paymentDate
        })
        .eq('id', billing.id);

      if (error) throw error;

      toast({
        title: "Cobrança atualizada",
        description: "Os detalhes da cobrança foram atualizados com sucesso."
      });
      
      onUpdate();
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao atualizar cobrança:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os detalhes da cobrança.",
        variant: "destructive"
      });
    }
  };

  const toggleEditing = () => {
    if (isEditing) {
      handleSaveChanges();
    } else {
      setIsEditing(true);
    }
  };

  const handleCopyDetails = () => {
    const details = `
      Cliente: ${billing.clients?.name}
      Descrição: ${description}
      Valor: ${formatCurrency(parseFloat(amount))}
      Vencimento: Dia ${dueDay}
      Status: ${status}
    `;

    navigator.clipboard.writeText(details);
    toast({
      title: "Detalhes copiados",
      description: "Os detalhes da cobrança foram copiados para a área de transferência."
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle>Detalhes do Pagamento</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client and Description fields */}
            <div>
              <Label htmlFor="client">Cliente</Label>
              <Input
                id="client"
                defaultValue={billing.clients?.name}
                className="bg-muted text-foreground"
                disabled={true} // Client can't be changed
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-muted text-foreground"
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Amount, Due Day, and Payment Method fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-muted text-foreground"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="due_day">Dia do Vencimento</Label>
              <Input
                id="due_day"
                type="number"
                value={dueDay}
                min="1"
                max="31"
                onChange={(e) => setDueDay(e.target.value)}
                className="bg-muted text-foreground"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="payment_method">Método de Pagamento</Label>
              <Select 
                value={paymentMethod} 
                onValueChange={(value: any) => setPaymentMethod(value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="bg-muted text-foreground">
                  <SelectValue placeholder="Selecione o método de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status, Start Date, and End Date fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={status} 
                onValueChange={(value: PaymentStatus) => setStatus(value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="bg-muted text-foreground">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="billed">Cobrado</SelectItem>
                  <SelectItem value="awaiting_invoice">Aguardando Nota Fiscal</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="partially_paid">Parcialmente Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formatDate(startDate)}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-muted text-foreground"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                value={formatDate(endDate)}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-muted text-foreground"
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Installments fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="installments">Parcelas</Label>
              <Input
                id="installments"
                type="number"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className="bg-muted text-foreground"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="current_installment">Parcela Atual</Label>
              <Input
                id="current_installment"
                type="number"
                value={currentInstallment}
                onChange={(e) => setCurrentInstallment(e.target.value)}
                className="bg-muted text-foreground"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="payment_date">Data de Pagamento</Label>
              <Input
                id="payment_date"
                type="date"
                value={paymentDate ? formatDate(paymentDate) : ''}
                onChange={(e) => setPaymentDate(e.target.value || null)}
                className="bg-muted text-foreground"
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyDetails}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Detalhes
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOpenSendInvoice(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Enviar Cobrança
            </Button>
          </div>
          <Button 
            size="sm" 
            onClick={toggleEditing}
            variant={isEditing ? "default" : "secondary"}
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </>
            )}
          </Button>
        </div>
      </DialogContent>

      <SendInvoiceDialog
        open={openSendInvoice}
        onClose={() => setOpenSendInvoice(false)}
        billing={billing}
        templates={templates}
      />
    </Dialog>
  );
};
