
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { BillingDetails } from "./BillingDetails";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        console.log("Billing details fetched:", data);
        setBillingData(data);
      } else {
        toast({
          title: "Dados não encontrados",
          description: "Não foi possível encontrar os detalhes deste recebimento.",
          variant: "destructive",
        });
      }
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
  useEffect(() => {
    if (open && billingId) {
      fetchBillingDetails();
    }
  }, [open, billingId]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setBillingData(null);
      setLoading(true);
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Recebimento</DialogTitle>
            <DialogDescription>
              Visualize ou altere as informações deste recebimento recorrente.
            </DialogDescription>
          </DialogHeader>
          
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ) : billingData ? (
            <div className="space-y-4">
              <BillingDetails billingData={billingData} />
              
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
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              Nenhum dado encontrado para este recebimento.
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
