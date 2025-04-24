
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RecurringBilling } from "@/types/billing";
import { EmailTemplate } from "@/types/email";
import { formatCurrency } from "@/utils/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Copy, Mail } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
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
  const [status, setStatus] = useState<PaymentStatus>(billing.status as PaymentStatus);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(billing.payment_date ? new Date(billing.payment_date) : undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [openSendInvoice, setOpenSendInvoice] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // You can handle individual input changes here if needed
    console.log(`Input ${name} changed to ${value}`);
  };

  const handleStatusChange = async (newStatus: PaymentStatus) => {
    try {
      const { error } = await supabase
        .from('recurring_billing')
        .update({ status: newStatus })
        .eq('id', billing.id);

      if (error) {
        console.error("Erro ao atualizar status:", error);
        toast({
          title: "Erro ao atualizar",
          description: "Não foi possível atualizar o status.",
          variant: "destructive"
        });
        return;
      }

      setStatus(newStatus);
      toast({
        title: "Status atualizado",
        description: "O status da cobrança foi atualizado com sucesso."
      });
      onUpdate();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status.",
        variant: "destructive"
      });
    }
  };

  const handlePaymentDateChange = async (date: Date | undefined) => {
    try {
      const paymentDateString = date ? date.toISOString() : null;

      const { error } = await supabase
        .from('recurring_billing')
        .update({ payment_date: paymentDateString })
        .eq('id', billing.id);

      if (error) {
        console.error("Erro ao atualizar data de pagamento:", error);
        toast({
          title: "Erro ao atualizar",
          description: "Não foi possível atualizar a data de pagamento.",
          variant: "destructive"
        });
        return;
      }

      setPaymentDate(date);
      toast({
        title: "Data de pagamento atualizada",
        description: "A data de pagamento da cobrança foi atualizada com sucesso."
      });
      onUpdate();
    } catch (error) {
      console.error("Erro ao atualizar data de pagamento:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a data de pagamento.",
        variant: "destructive"
      });
    }
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const handleCopyDetails = () => {
    const details = `
      Cliente: ${billing.clients?.name}
      Descrição: ${billing.description}
      Valor: ${formatCurrency(billing.amount)}
      Vencimento: ${format(new Date(billing.due_day), 'dd/MM/yyyy', { locale: ptBR })}
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Pagamento</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Cliente</Label>
              <Input id="client" defaultValue={billing.clients?.name} className="bg-gray-100 text-gray-700" disabled={!isEditing} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input id="description" defaultValue={billing.description} className="bg-gray-100 text-gray-700" disabled={!isEditing} onChange={handleInputChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="amount">Valor</Label>
              <Input id="amount" defaultValue={formatCurrency(billing.amount)} className="bg-gray-100 text-gray-700" disabled={!isEditing} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="due_day">Dia do Vencimento</Label>
              <Input id="due_day" type="number" defaultValue={billing.due_day} className="bg-gray-100 text-gray-700" disabled={!isEditing} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="payment_method">Método de Pagamento</Label>
              <Input id="payment_method" defaultValue={billing.payment_method} className="bg-gray-100 text-gray-700" disabled={!isEditing} onChange={handleInputChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={handleStatusChange} disabled={!isEditing}>
                <SelectTrigger className="w-full bg-gray-100 text-gray-700">
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
              <Input id="start_date" type="date" defaultValue={billing.start_date} className="bg-gray-100 text-gray-700" disabled={!isEditing} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="end_date">Data de Término</Label>
              <Input id="end_date" type="date" defaultValue={billing.end_date || ''} className="bg-gray-100 text-gray-700" disabled={!isEditing} onChange={handleInputChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="installments">Parcelas</Label>
              <Input id="installments" type="number" defaultValue={billing.installments} className="bg-gray-100 text-gray-700" disabled={!isEditing} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="current_installment">Parcela Atual</Label>
              <Input id="current_installment" type="number" defaultValue={billing.current_installment} className="bg-gray-100 text-gray-700" disabled={!isEditing} onChange={handleInputChange} />
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
          <Button size="sm" onClick={toggleEditing}>
            {isEditing ? "Salvar" : <Edit className="h-4 w-4 mr-2" />}
            {isEditing ? "Salvar" : "Editar"}
          </Button>
        </div>
      </DialogContent>
      <SendInvoiceDialog open={openSendInvoice} onClose={() => setOpenSendInvoice(false)} billing={billing} templates={templates} />
    </Dialog>
  );
};
