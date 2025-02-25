
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewPaymentForm } from "./NewPaymentForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { NewPayment } from "@/types/payment";
import type { EmailTemplate } from "@/types/email";

interface NewPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clients: Array<{ id: string; name: string }>;
  templates?: EmailTemplate[];
}

export const NewPaymentDialog = ({ open, onClose, onSuccess, clients, templates = [] }: NewPaymentDialogProps) => {
  const { toast } = useToast();

  const handleSubmit = async (payment: NewPayment & { email_template?: string }) => {
    console.log("Submitting payment:", payment);
    try {
      const { error } = await supabase
        .from('payments')
        .insert([{
          client_id: payment.client_id,
          description: payment.description,
          amount: payment.amount,
          due_date: payment.due_date,
          payment_method: payment.payment_method,
          status: payment.status
        }]);

      if (error) {
        console.error("Error creating payment:", error);
        toast({
          title: "Erro ao criar recebimento",
          description: error.message,
          variant: "destructive",
        });
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
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Recebimento</DialogTitle>
        </DialogHeader>
        <NewPaymentForm
          clients={clients}
          onSubmit={handleSubmit}
          onClose={onClose}
          templates={templates}
        />
      </DialogContent>
    </Dialog>
  );
};

