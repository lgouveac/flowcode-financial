import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { RecurringBilling } from "@/types/billing";
import type { Payment, NewPayment } from "@/types/payment";
import { NewRecurringBillingForm } from "./NewRecurringBillingForm";
import { NewPaymentForm } from "../payments/NewPaymentForm";
import { EmailTemplate } from "@/types/email";

interface NewBillingDialogProps {
  clients: Array<{ id: string; name: string; responsible_name?: string }>;
  onSuccess: () => void;
  templates?: EmailTemplate[];
}

export const NewBillingDialog = ({ clients, onSuccess, templates = [] }: NewBillingDialogProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'recurring' | 'onetime'>('recurring');
  const { toast } = useToast();

  const handleNewBilling = async (billing: RecurringBilling & { email_template?: string; responsible_name?: string }) => {
    console.log("Creating new billing:", billing);
    
    // First, update the client's responsible_name if needed
    if (billing.responsible_name && billing.client_id) {
      try {
        const { error: clientError } = await supabase
          .from('clients')
          .update({ responsible_name: billing.responsible_name })
          .eq('id', billing.client_id);
          
        if (clientError) {
          console.error('Error updating client responsible name:', clientError);
        }
      } catch (err) {
        console.error('Error updating client:', err);
      }
    }
    
    // Extract responsible_name before sending to avoid DB error
    const { responsible_name, ...billingData } = billing;
    
    // Create the billing record
    const { data, error } = await supabase
      .from('recurring_billing')
      .insert([billingData])
      .select()
      .single();

    if (error) {
      console.error('Error creating billing:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o recebimento recorrente.",
        variant: "destructive",
      });
      return;
    }

    console.log("New billing created:", data);
    setDialogOpen(false);
    
    // Give a small delay to ensure payments were created
    setTimeout(() => {
      onSuccess();
    }, 500);
    
    toast({
      title: "Sucesso",
      description: "Recebimento recorrente criado com sucesso.",
    });
  };

  const handleNewPayment = async (payment: NewPayment & { responsible_name?: string }) => {
    console.log("Creating new payment:", payment);
    
    // First, update the client's responsible_name if needed
    if (payment.responsible_name && payment.client_id) {
      try {
        const { error: clientError } = await supabase
          .from('clients')
          .update({ responsible_name: payment.responsible_name })
          .eq('id', payment.client_id);
          
        if (clientError) {
          console.error('Error updating client responsible name:', clientError);
        }
      } catch (err) {
        console.error('Error updating client:', err);
      }
    }
    
    // Extract responsible_name before sending to avoid DB error
    const { responsible_name, ...paymentData } = payment;
    
    // Use single object insert, not array
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o recebimento pontual.",
        variant: "destructive",
      });
      return;
    }

    console.log("New payment created:", data);
    setDialogOpen(false);
    onSuccess();
    
    toast({
      title: "Sucesso",
      description: "Recebimento pontual criado com sucesso.",
    });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Novo Recebimento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Recebimento</DialogTitle>
          <DialogDescription>
            Escolha o tipo de recebimento que deseja criar
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={paymentType} onValueChange={(value) => setPaymentType(value as 'recurring' | 'onetime')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recurring">Recorrente</TabsTrigger>
            <TabsTrigger value="onetime">Pontual</TabsTrigger>
          </TabsList>
          <TabsContent value="recurring">
            <NewRecurringBillingForm
              clients={clients}
              onSubmit={handleNewBilling}
              onClose={() => setDialogOpen(false)}
              templates={templates}
            />
          </TabsContent>
          <TabsContent value="onetime">
            <NewPaymentForm
              clients={clients}
              onSubmit={handleNewPayment}
              onClose={() => setDialogOpen(false)}
              templates={templates}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
