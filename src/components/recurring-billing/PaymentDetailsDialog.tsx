
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { RecurringBilling } from "@/types/billing";
import { Payment } from "@/types/payment";
import { Loader2 } from "lucide-react";

interface PaymentDetailsDialogProps {
  billingId: string | null;
  open: boolean;
  onClose: () => void;
}

export const PaymentDetailsDialog = ({ billingId, open, onClose }: PaymentDetailsDialogProps) => {
  const { toast } = useToast();
  const [billing, setBilling] = useState<RecurringBilling | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  useEffect(() => {
    if (open && billingId) {
      fetchBillingDetails();
    }
  }, [open, billingId]);

  const fetchBillingDetails = async () => {
    if (!billingId) return;
    
    setIsLoading(true);
    
    try {
      // Fetch billing details
      const { data: billingData, error: billingError } = await supabase
        .from('recurring_billing')
        .select('*, clients(name, email)')
        .eq('id', billingId)
        .single();

      if (billingError) throw billingError;
      
      setBilling(billingData);

      // Fetch related payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('description', billingData.description)
        .eq('client_id', billingData.client_id)
        .order('installment_number', { ascending: true });

      if (paymentsError) throw paymentsError;
      
      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error fetching details:', error);
      toast({
        title: "Erro ao carregar detalhes",
        description: "Não foi possível carregar os detalhes do recebimento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createPayment = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any form submission
    
    if (!billing) return;
    
    setIsCreatingPayment(true);
    
    try {
      // Calculate next due date based on the due_day
      const today = new Date();
      let dueDate = new Date(today.getFullYear(), today.getMonth(), billing.due_day);
      
      // If the calculated due date is in the past, move to next month
      if (dueDate < today) {
        dueDate = new Date(today.getFullYear(), today.getMonth() + 1, billing.due_day);
      }
      
      const formattedDueDate = dueDate.toISOString().split('T')[0];
      
      const newPayment = {
        client_id: billing.client_id,
        description: `${billing.description} (${billing.current_installment}/${billing.installments})`,
        amount: billing.amount,
        due_date: formattedDueDate,
        payment_method: billing.payment_method,
        status: 'pending',
        installment_number: billing.current_installment,
        total_installments: billing.installments,
        email_template: billing.email_template
      };
      
      const { error } = await supabase
        .from('payments')
        .insert([newPayment]);

      if (error) throw error;
      
      // Update current installment in recurring_billing
      if (billing.current_installment < billing.installments) {
        const { error: updateError } = await supabase
          .from('recurring_billing')
          .update({ 
            current_installment: billing.current_installment + 1
          })
          .eq('id', billingId);

        if (updateError) throw updateError;
      }
      
      toast({
        title: "Pagamento criado",
        description: "O pagamento foi criado com sucesso.",
      });
      
      // Refresh the data
      fetchBillingDetails();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Erro ao criar pagamento",
        description: "Não foi possível criar o pagamento.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Recebimento Recorrente</DialogTitle>
          <DialogDescription>
            Detalhes e histórico de pagamentos para este recebimento recorrente
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {billing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium">Informações Básicas</h3>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Cliente:</span> {(billing as any).clients?.name}</p>
                    <p><span className="font-medium">Descrição:</span> {billing.description}</p>
                    <p><span className="font-medium">Valor:</span> R$ {billing.amount.toFixed(2)}</p>
                    <p><span className="font-medium">Dia de Vencimento:</span> {billing.due_day}</p>
                    <p><span className="font-medium">Parcela Atual:</span> {billing.current_installment}/{billing.installments}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Ações</h3>
                  <div className="mt-2 space-y-3">
                    <Button 
                      onClick={createPayment}
                      disabled={isCreatingPayment || billing.current_installment > billing.installments}
                      className="w-full"
                    >
                      {isCreatingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        "Gerar Próximo Pagamento"
                      )}
                    </Button>
                    
                    {billing.current_installment > billing.installments && (
                      <p className="text-sm text-muted-foreground">
                        Todas as parcelas já foram geradas.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-medium mb-3">Histórico de Pagamentos</h3>
              {payments.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Parcela</th>
                        <th className="text-left p-3 font-medium">Descrição</th>
                        <th className="text-left p-3 font-medium">Valor</th>
                        <th className="text-left p-3 font-medium">Vencimento</th>
                        <th className="text-left p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-t">
                          <td className="p-3">{payment.installment_number}/{payment.total_installments}</td>
                          <td className="p-3">{payment.description}</td>
                          <td className="p-3">R$ {payment.amount.toFixed(2)}</td>
                          <td className="p-3">{new Date(payment.due_date).toLocaleDateString('pt-BR')}</td>
                          <td className="p-3 capitalize">{payment.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum pagamento gerado ainda.
                </p>
              )}
            </div>
            
            <div className="flex justify-end">
              <DialogClose asChild>
                <Button variant="outline" onClick={onClose}>
                  Fechar
                </Button>
              </DialogClose>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
