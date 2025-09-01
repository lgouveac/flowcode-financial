
import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

interface Client {
  id: string;
  name: string;
  partner_name?: string;
  responsible_name?: string;
}

interface NewBillingDialogProps {
  clients: Client[];
  onSuccess: () => void;
  templates?: EmailTemplate[];
}

export const NewBillingDialog = ({ clients = [], onSuccess, templates = [] }: NewBillingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [safeClients, setSafeClients] = useState<Client[]>([]);
  const [safeTemplates, setSafeTemplates] = useState<EmailTemplate[]>([]);
  const { toast } = useToast();
  
  // Process data safely when props change or dialog opens
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      
      // Process clients safely
      const validClients = Array.isArray(clients) 
        ? clients.filter(client => 
            client && 
            typeof client === 'object' && 
            client.id && 
            client.name
          )
        : [];
      
      // Process templates safely
      const validTemplates = Array.isArray(templates) 
        ? templates.filter(template => 
            template && 
            typeof template === 'object' && 
            template.id && 
            template.name && 
            template.subject && 
            template.content
          )
        : [];
        
      setSafeClients(validClients);
      setSafeTemplates(validTemplates);
      
      // Short timeout to ensure UI updates
      setTimeout(() => setIsLoading(false), 250);
    }
  }, [clients, templates, open]);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess();
  };

  const handleNewRecurring = async (billingData: Omit<RecurringBilling, 'id' | 'created_at' | 'updated_at' | 'current_installment'> & { 
    email_template?: string; 
    responsible_name?: string;
    disable_notifications?: boolean;
    pay_on_delivery?: boolean;
  }) => {
    if (!billingData || typeof billingData !== 'object') {
      toast({
        title: "Erro",
        description: "Dados de recebimento inválidos.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Creating new recurring billing:", billingData);
    console.log("Raw billingData.installments:", billingData.installments, "type:", typeof billingData.installments);
    setIsSubmitting(true);

    try {
      // Extract responsible_name, disable_notifications, pay_on_delivery and installments to update client and billing
      const { responsible_name, disable_notifications, pay_on_delivery, installments, ...billingRecordData } = billingData;
      
      console.log("After extraction - installments:", installments, "type:", typeof installments);
      console.log("billingRecordData:", billingRecordData);
      
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

      // Create installments directly in payments table (same logic as closed scope)
      const numInstallments = Number(installments);
      
      if (numInstallments && numInstallments > 0) {
        console.log('Creating installments for open scope billing:', numInstallments);
        try {
          const baseDescription = billingRecordData.description;
          const startDate = new Date(billingRecordData.start_date);
          
          const paymentsToInsert = [];
          for (let i = 1; i <= numInstallments; i++) {
            const installmentDueDate = new Date(startDate);
            installmentDueDate.setMonth(installmentDueDate.getMonth() + (i - 1));
            installmentDueDate.setDate(billingRecordData.due_day);
            
            paymentsToInsert.push({
              client_id: billingRecordData.client_id,
              description: `${baseDescription} (${i}/${numInstallments})`,
              amount: billingRecordData.amount,
              due_date: installmentDueDate.toISOString().split('T')[0],
              payment_method: billingRecordData.payment_method,
              status: 'pending',
              installment_number: i,
              total_installments: numInstallments,
              Pagamento_Por_Entrega: pay_on_delivery || false,
              scope_type: 'open'
            });
          }
          
          console.log('About to create payments:', paymentsToInsert);
          
          const { error: paymentsError } = await supabase
            .from('payments')
            .insert(paymentsToInsert);
            
          if (paymentsError) {
            console.error('Error creating payments:', paymentsError);
            throw paymentsError;
          } else {
            console.log('Successfully created payments');
          }
        } catch (paymentsErr) {
          console.error('Error creating payments:', paymentsErr);
          throw paymentsErr;
        }
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

  const handleNewPayment = async (payment: NewPayment & { responsible_name?: string; installments?: number }) => {
    if (!payment || typeof payment !== 'object') {
      toast({
        title: "Erro",
        description: "Dados de pagamento inválidos.",
        variant: "destructive",
      });
      return;
    }
    
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
      
      // Extract responsible_name and installments before processing
      const { responsible_name, installments = 1, ...paymentData } = payment;
      
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
      
      // Create multiple installments if needed
      if (installments > 1) {
        const baseDescription = paymentData.description;
        const startDate = new Date(paymentData.due_date);
        const installmentValue = paymentData.amount / installments;
        
        const installmentsToCreate = [];
        for (let i = 1; i <= installments; i++) {
          const dueDate = new Date(startDate);
          dueDate.setMonth(dueDate.getMonth() + (i - 1));
          
          installmentsToCreate.push({
            ...paymentData,
            description: `${baseDescription} (${i}/${installments})`,
            amount: installmentValue,
            due_date: dueDate.toISOString().split('T')[0],
            installment_number: i,
            total_installments: installments,
            // Only first installment keeps original status/payment_date if paid
            status: i === 1 ? paymentData.status : 'pending',
            payment_date: i === 1 ? paymentData.payment_date : undefined
          });
        }
        
        const { data, error } = await supabase
          .from('payments')
          .insert(installmentsToCreate)
          .select();
          
        if (error) {
          console.error('Error creating installments:', error);
          toast({
            title: "Erro",
            description: "Não foi possível criar as parcelas: " + error.message,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        toast({
          title: "Sucesso",
          description: `${installments} parcelas criadas com sucesso.`,
        });
      } else {
        // Single payment
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
      }

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

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isRecurring ? (
          <NewRecurringBillingForm
            clients={safeClients}
            onSubmit={handleNewRecurring}
            onClose={() => setOpen(false)}
            templates={safeTemplates}
            isSubmitting={isSubmitting}
          />
        ) : (
          <NewPaymentForm
            clients={safeClients}
            onSubmit={handleNewPayment}
            onClose={() => setOpen(false)}
            templates={safeTemplates}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
