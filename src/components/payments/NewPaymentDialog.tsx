
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewPaymentForm } from "./NewPaymentForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { NewPayment } from "@/types/payment";
import type { EmailTemplate } from "@/types/email";
import { useState } from "react";

interface NewPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clients: Array<{ id: string; name: string; partner_name?: string }>;
  templates?: EmailTemplate[];
}

export const NewPaymentDialog = ({ open, onClose, onSuccess, clients = [], templates = [] }: NewPaymentDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payment: NewPayment & { email_template?: string }) => {
    console.log("Submitting payment:", payment);
    setIsSubmitting(true);
    
    try {
      // Format date if needed
      let paymentData = { ...payment };
      
      if (payment.due_date && typeof payment.due_date === 'string') {
        if (!payment.due_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          try {
            const dateParts = payment.due_date.split('/');
            if (dateParts.length === 3) {
              const [day, month, year] = dateParts;
              paymentData.due_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          } catch (error) {
            console.error('Error formatting date:', error);
            toast({
              title: "Erro no formato da data",
              description: "Por favor, verifique o formato da data de vencimento",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
        }
      }
      
      // Create a single payment object, not an array
      const { error } = await supabase
        .from('payments')
        .insert({
          client_id: paymentData.client_id,
          description: paymentData.description,
          amount: paymentData.amount,
          due_date: paymentData.due_date,
          payment_method: paymentData.payment_method,
          status: paymentData.status,
          email_template: paymentData.email_template,
          paid_amount: paymentData.paid_amount
        });

      if (error) {
        console.error("Error creating payment:", error);
        toast({
          title: "Erro ao criar recebimento",
          description: error.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Recebimento criado",
        description: "O recebimento foi criado com sucesso.",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast({
        title: "Erro ao criar recebimento",
        description: "Ocorreu um erro ao criar o recebimento.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ensure clients and templates are arrays to prevent errors
  const safeClients = Array.isArray(clients) ? clients : [];
  const safeTemplates = Array.isArray(templates) ? templates : [];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isSubmitting && !isOpen) {
        onClose();
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Recebimento</DialogTitle>
        </DialogHeader>
        <NewPaymentForm
          clients={safeClients}
          onSubmit={handleSubmit}
          onClose={onClose}
          templates={safeTemplates}
        />
      </DialogContent>
    </Dialog>
  );
};
