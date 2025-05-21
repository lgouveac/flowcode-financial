
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { RecurringBilling } from "@/types/billing";
import type { NewPayment } from "@/types/payment";
import { NewRecurringBillingForm } from "./NewRecurringBillingForm";
import { NewPaymentForm } from "../payments/NewPaymentForm";
import { EmailTemplate } from "@/types/email";

interface NewBillingDialogProps {
  clients: Array<{ id: string; name: string; partner_name?: string; responsible_name?: string }>;
  onSuccess: () => void;
  templates?: EmailTemplate[];
}

export const NewBillingDialog = ({ clients = [], onSuccess, templates = [] }: NewBillingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Ensure clients and templates are always arrays to prevent errors
  const safeClients = Array.isArray(clients) ? clients : [];
  const safeTemplates = Array.isArray(templates) ? templates : [];

  const handleSuccess = () => {
    setOpen(false);
    onSuccess();
  };

  const handleNewRecurring = async (billingData: Omit<RecurringBilling, 'id' | 'created_at' | 'updated_at' | 'current_installment'> & { 
    email_template?: string; 
    responsible_name?: string;
    disable_notifications?: boolean;
  }) => {
    console.log("Creating new recurring billing:", billingData);
    setIsSubmitting(true);

    try {
      // Extract responsible_name and disable_notifications to update client and billing
      const { responsible_name, disable_notifications, ...billingRecordData } = billingData;
      
      // First, update the client's responsible_name if provided
      if (responsible_name && billingData.client_id) {
        const client = safeClients.find(c => c.id === billingData.client_id);
        if (client && responsible_name !== client.responsible_name) {
          console.log("Updating client responsible name:", responsible_name);
          const { error: updateError } = await supabase
            .from('clients')
            .update({ responsible_name })
            .eq('id', billingData.client_id);
            
          if (updateError) {
            console.error('Error updating client responsible_name:', updateError);
            toast({
              title: "Erro",
              description: "Erro ao atualizar o nome do responsável do cliente.",
              variant: "destructive",
            });
            // Continue with creating the billing even if updating the client fails
          }
        }
      }

      // Now insert the billing record with the disable_notifications flag
      const { data, error } = await supabase
        .from('recurring_billing')
        .insert({
          ...billingRecordData,
          disable_notifications: disable_notifications || false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating recurring billing:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar o recebimento recorrente.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Sucesso",
        description: "Recebimento recorrente criado com sucesso.",
      });

      handleSuccess();
    } catch (err) {
      console.error("Unexpected error creating recurring billing:", err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado ao criar o recebimento recorrente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewPayment = async (payment: NewPayment & { responsible_name?: string }) => {
    console.log("Creating new payment:", payment);
    setIsSubmitting(true);
    
    try {
      // First, update the client's responsible_name if needed
      if (payment.client_id && payment.responsible_name) {
        const client = safeClients.find(c => c.id === payment.client_id);
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
            // Continue with payment creation
          }
        }
      }
      
      // Extract responsible_name before sending to avoid DB error
      const { responsible_name, ...paymentData } = payment;
      
      // Make sure we're sending valid data - ensure dates are formatted correctly
      if (paymentData.due_date && typeof paymentData.due_date === 'string') {
        // Make sure the date is in ISO format YYYY-MM-DD
        if (!paymentData.due_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          try {
            const dateParts = paymentData.due_date.split('/');
            if (dateParts.length === 3) {
              const [day, month, year] = dateParts;
              paymentData.due_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          } catch (error) {
            console.error('Error formatting date:', error);
          }
        }
      }
      
      // Use single object insert
      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating payment:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar o recebimento: " + error.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Sucesso",
        description: "Recebimento criado com sucesso.",
      });

      handleSuccess();
    } catch (error) {
      console.error('Unexpected error in handleNewPayment:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado ao criar o recebimento.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!isSubmitting) {
        setOpen(newOpen);
      }
    }}>
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
            clients={safeClients}
            onSubmit={handleNewRecurring}
            onClose={() => setOpen(false)}
            templates={safeTemplates}
          />
        ) : (
          <NewPaymentForm
            clients={safeClients}
            onSubmit={handleNewPayment}
            onClose={() => setOpen(false)}
            templates={safeTemplates}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
