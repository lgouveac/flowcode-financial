
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { RecurringBilling } from "@/types/billing";
import type { Payment, NewPayment } from "@/types/payment";
import { NewRecurringBillingForm } from "./NewRecurringBillingForm";
import { NewPaymentForm } from "../payments/NewPaymentForm";
import { EmailTemplate } from "@/types/email";

interface NewBillingDialogProps {
  clients: Array<{ id: string; name: string; partner_name?: string; responsible_name?: string }>;
  onSuccess: () => void;
  templates?: EmailTemplate[];
}

export const NewBillingDialog = ({ clients, onSuccess, templates = [] }: NewBillingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(true);
  const { toast } = useToast();

  const handleSuccess = () => {
    setOpen(false);
    onSuccess();
  };

  const handleNewRecurring = async (billing: Omit<RecurringBilling, 'id' | 'created_at' | 'updated_at' | 'current_installment'> & { email_template?: string }) => {
    console.log("Creating new recurring billing:", billing);

    const { data, error } = await supabase
      .from('recurring_billing')
      .insert(billing as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating recurring billing:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o recebimento recorrente.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Recebimento recorrente criado com sucesso.",
    });

    handleSuccess();
  };

  const handleNewPayment = async (payment: NewPayment & { responsible_name?: string }) => {
    console.log("Creating new payment:", payment);
    
    // First, update the client's responsible_name if needed
    if (payment.client_id) {
      const client = clients.find(c => c.id === payment.client_id);
      if (client && payment.responsible_name !== (client.responsible_name || client.partner_name)) {
        const { error: updateError } = await supabase
          .from('clients')
          .update({ responsible_name: payment.responsible_name })
          .eq('id', payment.client_id);
          
        if (updateError) {
          console.error('Error updating client responsible_name:', updateError);
          toast({
            title: "Erro",
            description: "Erro ao atualizar o nome do responsável do cliente.",
            variant: "destructive",
          });
          return;
        }
      }
    }
    
    // Extract responsible_name before sending to avoid DB error
    const { responsible_name, ...paymentData } = payment;
    
    // Use single object insert, not array
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData as any)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o recebimento.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Recebimento criado com sucesso.",
    });

    handleSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><PlusIcon className="h-4 w-4 mr-2" /> Novo Recebimento</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{isRecurring ? "Novo Recebimento Recorrente" : "Novo Recebimento Pontual"}</DialogTitle>
          <div className="flex gap-2 mt-2">
            <Button
              variant={isRecurring ? "default" : "outline"}
              onClick={() => setIsRecurring(true)}
              size="sm"
            >
              Recorrente
            </Button>
            <Button
              variant={!isRecurring ? "default" : "outline"}
              onClick={() => setIsRecurring(false)}
              size="sm"
            >
              Pontual
            </Button>
          </div>
        </DialogHeader>

        {isRecurring ? (
          <NewRecurringBillingForm
            clients={clients}
            onSubmit={handleNewRecurring}
            onClose={() => setOpen(false)}
            templates={templates}
          />
        ) : (
          <NewPaymentForm
            clients={clients}
            onSubmit={handleNewPayment}
            onClose={() => setOpen(false)}
            templates={templates}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
