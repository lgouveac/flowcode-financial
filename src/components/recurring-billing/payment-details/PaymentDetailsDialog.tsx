
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CheckCircle, Edit2, Save, X } from "lucide-react";
import { BillingDetailsSection } from "./BillingDetailsSection";
import { PaymentsTableSection } from "./PaymentsTableSection";
import { ConfirmationDialogs } from "./ConfirmationDialogs";
import { type RecurringBilling } from "@/types/billing";
import { type Payment } from "@/types/payment";

interface PaymentDetailsDialogProps {
  billingId: string;
  open: boolean;
  onClose: () => void;
}

export const PaymentDetailsDialog = ({ billingId, open, onClose }: PaymentDetailsDialogProps) => {
  const [billingData, setBillingData] = useState<any>(null);
  const [editedBillingData, setEditedBillingData] = useState<Partial<RecurringBilling>>({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [showMarkAsPaidConfirm, setShowMarkAsPaidConfirm] = useState(false);
  const [paymentToUpdate, setPaymentToUpdate] = useState<string | null>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [showUpdatePaymentsConfirm, setShowUpdatePaymentsConfirm] = useState(false);
  const [originalStartDate, setOriginalStartDate] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBillingDetails = async () => {
    setLoading(true);
    
    try {
      // First fetch the billing data without the client join
      const { data: billingDataResult, error: billingError } = await supabase
        .from('recurring_billing')
        .select('*')
        .eq('id', billingId)
        .maybeSingle();

      if (billingError) throw billingError;
      
      if (billingDataResult) {
        console.log("Billing details fetched:", billingDataResult);
        
        // Store the original start date for comparison later
        setOriginalStartDate(billingDataResult.start_date);
        
        // Then fetch the client data separately
        const { data: clientDataResult, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', billingDataResult.client_id)
          .maybeSingle();
          
        if (clientError) throw clientError;
        
        if (clientDataResult) {
          console.log("Client data fetched:", clientDataResult);
          setClientData(clientDataResult);
          
          // Combine the data
          const combinedData = {
            ...billingDataResult,
            clients: clientDataResult
          };
          
          setBillingData(combinedData);
          setEditedBillingData(billingDataResult);
        }
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

  const fetchAssociatedPayments = async () => {
    setPaymentsLoading(true);
    
    try {
      if (!billingData || !billingData.client_id) {
        console.log("No billing data available yet for fetching payments");
        setPaymentsLoading(false);
        return;
      }
      
      // Fetch all payments from this client with matching installments
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          clients:client_id (*)
        `)
        .eq('client_id', billingData.client_id)
        .eq('total_installments', billingData.installments)
        .order('installment_number', { ascending: true });

      if (error) throw error;
      
      if (data) {
        console.log("Associated payments fetched:", data);
        
        // Filter payments to match the billing description pattern
        const baseDescription = billingData.description.split(' (')[0];
        const filteredPayments = data.filter(payment => 
          payment.description.includes(baseDescription)
        );
        
        console.log("Filtered payments:", filteredPayments);
        setPayments(filteredPayments);
      }
    } catch (error) {
      console.error('Error fetching associated payments:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pagamentos associados.",
        variant: "destructive",
      });
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleMarkBillingAsPaid = async () => {
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

  const handleMarkPaymentAsPaid = async (paymentId: string) => {
    try {
      const now = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
      
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          payment_date: now 
        })
        .eq('id', paymentId);

      if (error) throw error;

      // Create cash flow entry for the payment
      const payment = payments.find(p => p.id === paymentId);
      if (payment) {
        const { error: cashFlowError } = await supabase
          .from('cash_flow')
          .insert({
            type: 'income',
            description: payment.description,
            amount: payment.amount,
            date: now,
            category: 'payment',
            payment_id: paymentId
          });

        if (cashFlowError) throw cashFlowError;
      }

      toast({
        title: "Pagamento marcado como pago",
        description: "O status foi atualizado e registrado no fluxo de caixa.",
      });
      
      // Refetch the data to show updated status
      fetchAssociatedPayments();
      setPaymentToUpdate(null);
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do pagamento.",
        variant: "destructive",
      });
    }
  };

  const updateBillingField = (field: string, value: string | number) => {
    setEditedBillingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateNewPaymentDates = () => {
    if (!editedBillingData.start_date || !originalStartDate || !billingData || !payments.length) {
      return [];
    }

    const originalStartDateObj = new Date(originalStartDate);
    const newStartDateObj = new Date(editedBillingData.start_date);
    
    // Calculate the difference in days between the original and new start dates
    const daysDifference = Math.floor(
      (newStartDateObj.getTime() - originalStartDateObj.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // If there's no difference, no need to update
    if (daysDifference === 0) return [];

    // Generate updated due dates for each payment
    return payments.map(payment => {
      const currentDueDate = new Date(payment.due_date);
      const newDueDate = new Date(currentDueDate);
      newDueDate.setDate(newDueDate.getDate() + daysDifference);
      
      return {
        paymentId: payment.id,
        oldDueDate: payment.due_date,
        newDueDate: newDueDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
      };
    });
  };

  const updatePaymentDates = async () => {
    try {
      const updatedPaymentDates = calculateNewPaymentDates();
      
      if (!updatedPaymentDates.length) {
        toast({
          title: "Nenhuma alteração necessária",
          description: "As datas dos pagamentos não precisam ser atualizadas.",
        });
        return;
      }
      
      // Update each payment with its new due date
      for (const update of updatedPaymentDates) {
        const { error } = await supabase
          .from('payments')
          .update({ due_date: update.newDueDate })
          .eq('id', update.paymentId);
          
        if (error) throw error;
      }
      
      toast({
        title: "Datas atualizadas",
        description: `Datas de vencimento de ${updatedPaymentDates.length} pagamentos foram atualizadas.`,
      });
      
      // Refetch data to show updated dates
      fetchAssociatedPayments();
      setShowUpdatePaymentsConfirm(false);
    } catch (error) {
      console.error('Error updating payment dates:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as datas dos pagamentos.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBillingDetails = async () => {
    try {
      // Only update the fields that can be edited, not the entire object
      const updatableFields = {
        description: editedBillingData.description,
        amount: editedBillingData.amount,
        installments: editedBillingData.installments,
        due_day: editedBillingData.due_day,
        start_date: editedBillingData.start_date,
        end_date: editedBillingData.end_date
      };
      
      console.log("Updating billing with data:", updatableFields);
      
      const { error } = await supabase
        .from('recurring_billing')
        .update(updatableFields)
        .eq('id', billingId);

      if (error) throw error;

      toast({
        title: "Dados atualizados",
        description: "As informações do recebimento foram atualizadas com sucesso.",
      });
      
      // Check if the start date was changed
      if (editedBillingData.start_date !== originalStartDate && payments.length > 0) {
        setShowUpdatePaymentsConfirm(true);
      } else {
        setIsEditing(false);
        fetchBillingDetails();
      }
    } catch (error) {
      console.error('Error updating billing details:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as informações do recebimento.",
        variant: "destructive",
      });
    }
  };

  // Only fetch associated payments when billing data is loaded
  useEffect(() => {
    if (billingData && billingData.client_id) {
      fetchAssociatedPayments();
    }
  }, [billingData]);

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
      setEditedBillingData({});
      setIsEditing(false);
      setPayments([]);
      setLoading(true);
      setPaymentsLoading(true);
      setClientData(null);
      setOriginalStartDate(null);
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-4xl bg-background text-foreground">
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
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Informações do Recebimento</h3>
                {!isEditing ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditedBillingData(billingData);
                      }}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleUpdateBillingDetails}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Salvar
                    </Button>
                  </div>
                )}
              </div>
              
              <BillingDetailsSection
                billingData={billingData}
                editedBillingData={editedBillingData}
                isEditing={isEditing}
                updateBillingField={updateBillingField}
              />

              <PaymentsTableSection
                payments={payments}
                paymentsLoading={paymentsLoading}
                setPaymentToUpdate={setPaymentToUpdate}
              />
              
              {billingData.status !== 'paid' && billingData.status !== 'cancelled' && !isEditing && (
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

      <ConfirmationDialogs
        showMarkAsPaidConfirm={showMarkAsPaidConfirm}
        setShowMarkAsPaidConfirm={setShowMarkAsPaidConfirm}
        handleMarkBillingAsPaid={handleMarkBillingAsPaid}
        paymentToUpdate={paymentToUpdate}
        setPaymentToUpdate={setPaymentToUpdate}
        handleMarkPaymentAsPaid={handleMarkPaymentAsPaid}
        showUpdatePaymentsConfirm={showUpdatePaymentsConfirm}
        setShowUpdatePaymentsConfirm={setShowUpdatePaymentsConfirm}
        updatePaymentDates={updatePaymentDates}
        fetchBillingDetails={fetchBillingDetails}
      />
    </>
  );
};
