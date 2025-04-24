
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Pencil, Trash2, Copy } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PaymentDetailsDialog } from "./PaymentDetailsDialog";
import type { Payment } from "@/types/payment";
import type { EmailTemplate } from "@/types/email";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SendEmailDialog } from "@/components/emails/SendEmailDialog";

interface PaymentActionsProps {
  payment: Payment;
  onPaymentUpdated: () => void;
  enableDuplicate?: boolean;
  templates?: EmailTemplate[];
}

export const PaymentActions = ({ 
  payment, 
  onPaymentUpdated, 
  enableDuplicate = false,
  templates = []
}: PaymentActionsProps) => {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Recebimento excluído",
        description: "O recebimento foi excluído com sucesso."
      });
      onPaymentUpdated();
    } catch (error) {
      console.error("Erro ao excluir recebimento:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o recebimento.",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      setDuplicating(true);
      
      // Create a clean payment object for duplication
      // Only include fields that exist in the payments table
      const paymentToDuplicate = {
        client_id: payment.client_id,
        description: `${payment.description} (Cópia)`,
        amount: payment.amount,
        due_date: payment.due_date,
        payment_method: payment.payment_method,
        status: 'pending' as const, // Type assertion to narrow the string type
        email_template: payment.email_template
      };
      
      const { error } = await supabase
        .from('payments')
        .insert(paymentToDuplicate)
        .select();

      if (error) throw error;

      toast({
        title: "Recebimento duplicado",
        description: "Uma cópia do recebimento foi criada com sucesso."
      });
      onPaymentUpdated();
    } catch (error) {
      console.error("Erro ao duplicar recebimento:", error);
      toast({
        title: "Erro ao duplicar",
        description: "Não foi possível duplicar o recebimento.",
        variant: "destructive"
      });
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        title="Editar"
        onClick={() => setShowEditDialog(true)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        title="Enviar email"
        onClick={() => setShowEmailDialog(true)}
      >
        <Mail className="h-4 w-4" />
      </Button>
      
      {enableDuplicate && (
        <Button
          variant="ghost"
          size="icon"
          title="Duplicar"
          onClick={handleDuplicate}
          disabled={duplicating}
        >
          <Copy className="h-4 w-4" />
        </Button>
      )}
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Recebimento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este recebimento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showEditDialog && (
        <PaymentDetailsDialog
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onUpdate={onPaymentUpdated}
          payment={payment}
          templates={templates}
        />
      )}

      {showEmailDialog && (
        <SendEmailDialog
          open={showEmailDialog}
          onClose={() => setShowEmailDialog(false)}
          initialClientId={payment.client_id}
          initialTemplateId={payment.email_template}
        />
      )}
    </div>
  );
};
