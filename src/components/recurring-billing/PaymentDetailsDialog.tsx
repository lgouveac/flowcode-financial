
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { BillingDetails } from "./BillingDetails";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle } from "lucide-react";

interface PaymentDetailsDialogProps {
  billingId: string;
  open: boolean;
  onClose: () => void;
}

export const PaymentDetailsDialog = ({ billingId, open, onClose }: PaymentDetailsDialogProps) => {
  const [billingData, setBillingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMarkAsPaidConfirm, setShowMarkAsPaidConfirm] = useState(false);
  const { toast } = useToast();

  const fetchBillingDetails = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('recurring_billing')
        .select(`
          *,
          clients (
            name,
            email,
            responsible_name
          )
        `)
        .eq('id', billingId)
        .single();

      if (error) throw error;
      setBillingData(data);
    } catch (error) {
      console.error('Error fetching billing details:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do recebimento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      const now = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
      
      const { error } = await supabase
        .from('recurring_billing')
        .update({ 
          status: 'paid',
          payment_date: now 
        })
        .eq('id', billingId);

      if (error) throw error;

      // Create cash flow entry for the payment
      const { error: cashFlowError } = await supabase
        .from('cash_flow')
        .insert({
          type: 'income',
          description: billingData.description,
          amount: billingData.amount,
          date: now,
          category: 'payment',
          payment_id: billingId
        });

      if (cashFlowError) throw cashFlowError;

      toast({
        title: "Recebimento marcado como pago",
        description: "O status foi atualizado e registrado no fluxo de caixa.",
      });
      
      // Refetch the data to show updated status
      fetchBillingDetails();
      setShowMarkAsPaidConfirm(false);
    } catch (error) {
      console.error('Error marking billing as paid:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do recebimento.",
        variant: "destructive",
      });
    }
  };

  // Fetch data when dialog opens
  if (open && !billingData && !loading) {
    fetchBillingDetails();
  }

  // Reset state when dialog closes
  if (!open && billingData) {
    setBillingData(null);
  }

  // If we don't have data yet, show loading state
  if (!billingData && loading) {
    return (
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Carregando detalhes...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  // If we have data, show the details
  return (
    <>
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Recebimento</DialogTitle>
          </DialogHeader>
          
          {billingData && (
            <div className="space-y-4">
              <BillingDetails billing={billingData} />
              
              {billingData.status !== 'paid' && billingData.status !== 'cancelled' && (
                <div className="flex justify-end">
                  <Button 
                    className="gap-2"
                    onClick={() => setShowMarkAsPaidConfirm(true)}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Marcar como Pago
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showMarkAsPaidConfirm} onOpenChange={setShowMarkAsPaidConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar este recebimento como pago? 
              Esta ação também registrará o pagamento no fluxo de caixa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAsPaid}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
