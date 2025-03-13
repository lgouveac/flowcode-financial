
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { RecurringBilling } from "@/types/billing";
import { Payment, EditablePaymentFields } from "@/types/payment";
import { Loader2, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
  const [isUpdatingPayment, setIsUpdatingPayment] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (open && billingId) {
      fetchBillingDetails();
    }
  }, [open, billingId]);

  const fetchBillingDetails = async () => {
    if (!billingId) return;
    
    setIsLoading(true);
    
    try {
      console.log("Fetching billing details for ID:", billingId);
      
      // Fetch billing details
      const { data: billingData, error: billingError } = await supabase
        .from('recurring_billing')
        .select('*, clients(name, email)')
        .eq('id', billingId)
        .single();

      if (billingError) {
        console.error('Error fetching billing details:', billingError);
        throw billingError;
      }
      
      console.log("Received billing data:", billingData);
      setBilling(billingData);

      // Fetch related payments
      await fetchRelatedPayments(billingData);
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

  const fetchRelatedPayments = async (billingData: RecurringBilling) => {
    try {
      console.log("Fetching related payments for billing description:", billingData.description);
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*, clients(name, email, partner_name)')
        .eq('description', billingData.description)
        .eq('client_id', billingData.client_id)
        .order('installment_number', { ascending: true });

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        throw paymentsError;
      }
      
      console.log("Received payments data:", paymentsData);
      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error fetching related payments:', error);
      toast({
        title: "Erro ao carregar pagamentos",
        description: "Não foi possível carregar os pagamentos relacionados.",
        variant: "destructive",
      });
    }
  };

  const refreshData = async () => {
    if (!billing) return;
    
    setIsRefreshing(true);
    try {
      await fetchRelatedPayments(billing);
      toast({
        title: "Dados atualizados",
        description: "Os pagamentos foram atualizados com sucesso.",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const createPayment = async (event: React.MouseEvent) => {
    // Prevent default behavior and stop propagation
    event.preventDefault();
    event.stopPropagation();
    
    // Safety check
    if (!billing) {
      console.error("Cannot create payment: billing data is null");
      return;
    }
    
    console.log("Creating payment for billing:", billing);
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
      console.log("Calculated due date:", formattedDueDate);
      
      // Create payment object with correct types
      const newPayment = {
        client_id: billing.client_id,
        description: `${billing.description} (${billing.current_installment}/${billing.installments})`,
        amount: billing.amount,
        due_date: formattedDueDate,
        payment_method: billing.payment_method,
        status: 'pending' as const, // Explicitly typed as a literal
        installment_number: billing.current_installment,
        total_installments: billing.installments
      };
      
      console.log("Preparing to insert payment:", newPayment);
      
      // Insert the new payment
      const { data, error } = await supabase
        .from('payments')
        .insert(newPayment)
        .select();

      if (error) {
        console.error('Error inserting payment:', error);
        throw error;
      }
      
      console.log("Payment created successfully:", data);
      
      // Update current installment in recurring_billing
      if (billing.current_installment < billing.installments) {
        console.log("Updating current installment from", billing.current_installment, "to", billing.current_installment + 1);
        
        const { error: updateError } = await supabase
          .from('recurring_billing')
          .update({ 
            current_installment: billing.current_installment + 1
          })
          .eq('id', billingId);

        if (updateError) {
          console.error('Error updating recurring billing:', updateError);
          throw updateError;
        }
        
        console.log("Current installment updated successfully");
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

  const updatePayment = async (paymentId: string, updatedFields: Partial<EditablePaymentFields>) => {
    setIsUpdatingPayment(paymentId);
    
    try {
      console.log("Updating payment:", paymentId, updatedFields);
      
      const { error } = await supabase
        .from('payments')
        .update(updatedFields)
        .eq('id', paymentId);

      if (error) throw error;
      
      toast({
        title: "Pagamento atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
      
      // Update local state to reflect changes immediately
      setPayments(prevPayments => 
        prevPayments.map(payment => 
          payment.id === paymentId 
            ? { ...payment, ...updatedFields } 
            : payment
        )
      );
      
      // Fetch fresh data from the server
      if (billing) {
        fetchRelatedPayments(billing);
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Erro ao atualizar pagamento",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPayment(null);
    }
  };

  // This is a manual dialog close handler that ensures proper cleanup
  const handleDialogClose = () => {
    // Reset state when dialog closes
    setBilling(null);
    setPayments([]);
    // Call the parent's onClose handler
    onClose();
  };

  // Helper function to get status badge variant
  const getStatusBadgeVariant = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Helper function to get status label
  const getStatusLabel = (status: Payment['status']) => {
    const statusLabels: Record<Payment['status'], string> = {
      pending: 'Pendente',
      billed: 'Faturado',
      awaiting_invoice: 'Aguardando Fatura',
      paid: 'Pago',
      overdue: 'Atrasado',
      cancelled: 'Cancelado'
    };
    return statusLabels[status];
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleDialogClose()}>
      <DialogContent className="max-w-3xl" onClick={(e) => e.stopPropagation()}>
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
                      type="button"
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
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">Histórico de Pagamentos</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshData}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-1">Atualizar</span>
                </Button>
              </div>
              
              {payments.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Parcela</th>
                        <th className="text-left p-3 font-medium">Descrição</th>
                        <th className="text-left p-3 font-medium">Valor</th>
                        <th className="text-left p-3 font-medium">Vencimento</th>
                        <th className="text-left p-3 font-medium">Data Pgto.</th>
                        <th className="text-left p-3 font-medium">Método</th>
                        <th className="text-left p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-t">
                          <td className="p-3">
                            {payment.installment_number}/{payment.total_installments}
                          </td>
                          <td className="p-3">
                            <Input
                              value={payment.description}
                              onChange={(e) => updatePayment(payment.id, { description: e.target.value })}
                              className="h-8 text-sm"
                              onBlur={(e) => {
                                // Only update if value actually changed
                                if (e.target.value !== payment.description) {
                                  updatePayment(payment.id, { description: e.target.value });
                                }
                              }}
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={payment.amount}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value)) {
                                  setPayments(prevPayments =>
                                    prevPayments.map(p =>
                                      p.id === payment.id ? { ...p, amount: value } : p
                                    )
                                  );
                                }
                              }}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value) && value !== payment.amount) {
                                  updatePayment(payment.id, { amount: value });
                                }
                              }}
                              className="h-8 text-sm w-24"
                              step="0.01"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="date"
                              value={payment.due_date}
                              onChange={(e) => {
                                setPayments(prevPayments =>
                                  prevPayments.map(p =>
                                    p.id === payment.id ? { ...p, due_date: e.target.value } : p
                                  )
                                );
                              }}
                              onBlur={(e) => {
                                if (e.target.value !== payment.due_date) {
                                  updatePayment(payment.id, { due_date: e.target.value });
                                }
                              }}
                              className="h-8 text-sm"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="date"
                              value={payment.payment_date || ''}
                              onChange={(e) => {
                                setPayments(prevPayments =>
                                  prevPayments.map(p =>
                                    p.id === payment.id ? { ...p, payment_date: e.target.value || undefined } : p
                                  )
                                );
                              }}
                              onBlur={(e) => {
                                const newValue = e.target.value || undefined;
                                if (newValue !== payment.payment_date) {
                                  updatePayment(payment.id, { payment_date: newValue });
                                }
                              }}
                              className="h-8 text-sm"
                            />
                          </td>
                          <td className="p-3">
                            <Select
                              value={payment.payment_method}
                              onValueChange={(value: 'pix' | 'boleto' | 'credit_card') => {
                                if (value !== payment.payment_method) {
                                  updatePayment(payment.id, { payment_method: value });
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 text-sm w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pix">PIX</SelectItem>
                                <SelectItem value="boleto">Boleto</SelectItem>
                                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            <Select
                              value={payment.status}
                              onValueChange={(value: Payment['status']) => {
                                if (value !== payment.status) {
                                  updatePayment(payment.id, { status: value });
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 text-sm w-[150px]">
                                <SelectValue>
                                  <Badge variant={getStatusBadgeVariant(payment.status)}>
                                    {getStatusLabel(payment.status)}
                                  </Badge>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="billed">Faturado</SelectItem>
                                <SelectItem value="awaiting_invoice">Aguardando Fatura</SelectItem>
                                <SelectItem value="paid">Pago</SelectItem>
                                <SelectItem value="overdue">Atrasado</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
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
                <Button variant="outline" onClick={handleDialogClose} type="button">
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
