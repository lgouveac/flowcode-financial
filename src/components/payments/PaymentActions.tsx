
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Copy } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PaymentDetailsDialog } from "./PaymentDetailsDialog";
import type { Payment } from "@/types/payment";
import type { EmailTemplate } from "@/types/email";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  const handleDelete = async () => {
    try {
      setDeleting(true);
      
      // Verificar se este pagamento faz parte de uma cobrança recorrente
      const isInstallment = payment.installment_number && payment.total_installments;
      
      if (isInstallment) {
        // Buscar todos os pagamentos relacionados (mesmo client_id e descrição base similar)
        const baseDescription = payment.description.replace(/\s*\(\d+\/\d+\)$/, '');
        
        const { data: relatedPayments, error: fetchError } = await supabase
          .from('payments')
          .select('*')
          .eq('client_id', payment.client_id)
          .like('description', `${baseDescription}%`)
          .order('installment_number', { ascending: true });

        if (fetchError) throw fetchError;

        // Excluir o pagamento
        const { error: deleteError } = await supabase
          .from('payments')
          .delete()
          .eq('id', payment.id);

        if (deleteError) throw deleteError;

        // Filtrar os pagamentos restantes (excluindo o que foi deletado)
        const remainingPayments = relatedPayments.filter(p => p.id !== payment.id);
        
        if (remainingPayments.length > 0) {
          // Atualizar a numeração das parcelas restantes
          const updatePromises = remainingPayments.map((p, index) => {
            const newInstallmentNumber = index + 1;
            const newTotalInstallments = remainingPayments.length;
            const newDescription = `${baseDescription} (${newInstallmentNumber}/${newTotalInstallments})`;
            
            return supabase
              .from('payments')
              .update({
                installment_number: newInstallmentNumber,
                total_installments: newTotalInstallments,
                description: newDescription
              })
              .eq('id', p.id);
          });

          await Promise.all(updatePromises);

          // Buscar a cobrança recorrente relacionada para atualizar
          const { data: billingData, error: billingFetchError } = await supabase
            .from('recurring_billing')
            .select('*')
            .eq('client_id', payment.client_id)
            .like('description', `${baseDescription}%`)
            .single();

          if (!billingFetchError && billingData) {
            // Atualizar o total de parcelas na cobrança recorrente
            await supabase
              .from('recurring_billing')
              .update({
                installments: remainingPayments.length,
                updated_at: new Date().toISOString()
              })
              .eq('id', billingData.id);
          }

          toast({
            title: "Parcela excluída",
            description: `Parcela excluída com sucesso. Total de parcelas atualizado para ${remainingPayments.length}.`
          });
        } else {
          toast({
            title: "Parcela excluída",
            description: "Última parcela excluída com sucesso."
          });
        }
      } else {
        // Pagamento pontual normal
        const { error } = await supabase
          .from('payments')
          .delete()
          .eq('id', payment.id);

        if (error) throw error;

        toast({
          title: "Recebimento excluído",
          description: "O recebimento foi excluído com sucesso."
        });
      }

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
              {payment.installment_number && payment.total_installments && (
                <span className="block mt-2 text-amber-600">
                  Esta é uma parcela de uma cobrança recorrente. As parcelas restantes serão renumeradas automaticamente.
                </span>
              )}
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
    </div>
  );
};
