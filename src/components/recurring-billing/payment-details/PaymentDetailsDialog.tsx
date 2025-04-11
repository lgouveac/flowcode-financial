
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { BillingDetailsSection } from "./BillingDetailsSection";
import { PaymentsTableSection } from "./PaymentsTableSection";
import { ConfirmationDialogs } from "./ConfirmationDialogs";

export const PaymentDetailsDialog = ({
  billingId,
  open,
  onClose,
}: {
  billingId: string | null;
  open: boolean;
  onClose: () => void;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const [showUpdateConfirmDialog, setShowUpdateConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [originalStartDate, setOriginalStartDate] = useState<string | null>(null);
  const [newStartDate, setNewStartDate] = useState<string | null>(null);

  // Fetch billing details
  const {
    data: billing,
    isLoading: isLoadingBilling,
    error: billingError,
  } = useQuery({
    queryKey: ["billing", billingId],
    queryFn: async () => {
      if (!billingId) return null;

      const { data, error } = await supabase
        .from("recurring_billing")
        .select("*, client:clients(*)")
        .eq("id", billingId)
        .single();

      if (error) throw error;
      
      // Store the original start date for comparison later
      setOriginalStartDate(data.start_date);
      
      return data;
    },
    enabled: !!billingId && open,
  });

  // Fetch payments for this billing
  const {
    data: payments,
    isLoading: isLoadingPayments,
    error: paymentsError,
  } = useQuery({
    queryKey: ["payments", billingId],
    queryFn: async () => {
      if (!billingId) return [];

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("recurring_billing_id", billingId)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!billingId && open,
  });

  // Update a payment's status
  const updatePaymentStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("payments")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", billingId] });
      toast({
        title: "Status atualizado",
        description: "O status do pagamento foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error updating payment status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: "Ocorreu um erro ao atualizar o status do pagamento.",
        variant: "destructive",
      });
    },
  });

  // Update billing information
  const updateBilling = useMutation({
    mutationFn: async (updatedBilling: any) => {
      const { data, error } = await supabase
        .from("recurring_billing")
        .update(updatedBilling)
        .eq("id", billingId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", billingId] });
      queryClient.invalidateQueries({ queryKey: ["recurring-billing"] });
      toast({
        title: "Faturamento atualizado",
        description: "As informações de faturamento foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error updating billing:", error);
      toast({
        title: "Erro ao atualizar faturamento",
        description: "Ocorreu um erro ao atualizar as informações de faturamento.",
        variant: "destructive",
      });
    },
  });

  // Cancel a billing
  const cancelBilling = useMutation({
    mutationFn: async () => {
      // First update the billing status
      const { error: billingError } = await supabase
        .from("recurring_billing")
        .update({ status: "cancelled" })
        .eq("id", billingId);

      if (billingError) throw billingError;

      // Then update all pending payments to cancelled
      const { error: paymentsError } = await supabase
        .from("payments")
        .update({ status: "cancelled" })
        .eq("recurring_billing_id", billingId)
        .in("status", ["pending", "overdue"]);

      if (paymentsError) throw paymentsError;
      
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", billingId] });
      queryClient.invalidateQueries({ queryKey: ["payments", billingId] });
      queryClient.invalidateQueries({ queryKey: ["recurring-billing"] });
      toast({
        title: "Faturamento cancelado",
        description: "O faturamento recorrente foi cancelado com sucesso.",
      });
      setShowCancelDialog(false);
    },
    onError: (error) => {
      console.error("Error cancelling billing:", error);
      toast({
        title: "Erro ao cancelar faturamento",
        description: "Ocorreu um erro ao cancelar o faturamento recorrente.",
        variant: "destructive",
      });
    },
  });

  // Calculate new dates for payments when start date changes
  const calculateNewPaymentDates = (originalDate: string, newDate: string, payments: any[]) => {
    if (!payments || !payments.length) return [];
    
    const originalDateObj = new Date(originalDate);
    const newDateObj = new Date(newDate);
    const diffTime = newDateObj.getTime() - originalDateObj.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return payments.map(payment => {
      const dueDate = new Date(payment.due_date);
      dueDate.setDate(dueDate.getDate() + diffDays);
      
      return {
        ...payment,
        due_date: dueDate.toISOString().split('T')[0]
      };
    });
  };

  // Update payment dates when start date changes
  const updatePaymentDates = async (newPayments: any[]) => {
    setLoading(true);
    try {
      for (const payment of newPayments) {
        const { error } = await supabase
          .from("payments")
          .update({ due_date: payment.due_date })
          .eq("id", payment.id);
          
        if (error) throw error;
      }
      
      queryClient.invalidateQueries({ queryKey: ["payments", billingId] });
      toast({
        title: "Datas atualizadas",
        description: "As datas de pagamento foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error("Error updating payment dates:", error);
      toast({
        title: "Erro ao atualizar datas",
        description: "Ocorreu um erro ao atualizar as datas de pagamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowUpdateConfirmDialog(false);
    }
  };

  const handleStartDateChange = (date: string) => {
    if (date !== originalStartDate) {
      setNewStartDate(date);
      setShowUpdateConfirmDialog(true);
    }
  };

  const confirmDateUpdate = async () => {
    if (!newStartDate || !originalStartDate || !payments) return;
    
    // First update the billing start date
    await updateBilling({ start_date: newStartDate });
    
    // Then update all the payment dates
    const updatedPayments = calculateNewPaymentDates(originalStartDate, newStartDate, payments);
    await updatePaymentDates(updatedPayments);
    
    // Update the original start date for future comparisons
    setOriginalStartDate(newStartDate);
    setNewStartDate(null);
  };

  const handleStatusChange = (paymentId: string, newStatus: string) => {
    updatePaymentStatus.mutate({ id: paymentId, status: newStatus });
  };

  // Reset active tab when dialog is opened/closed
  useEffect(() => {
    if (open) {
      setActiveTab("details");
    }
  }, [open]);

  const isLoading = isLoadingBilling || isLoadingPayments || loading;
  const hasError = billingError || paymentsError;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Faturamento Recorrente</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : hasError ? (
          <div className="text-center p-4 text-destructive">
            Ocorreu um erro ao carregar os detalhes. Por favor, tente novamente.
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="payments">Pagamentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 pt-4">
                {billing && (
                  <BillingDetailsSection 
                    billing={billing} 
                    onUpdate={updateBilling.mutate}
                    onCancel={() => setShowCancelDialog(true)}
                    onStartDateChange={handleStartDateChange}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="payments" className="pt-4">
                <PaymentsTableSection 
                  payments={payments || []}
                  onStatusChange={handleStatusChange}
                  isUpdating={updatePaymentStatus.isPending}
                />
              </TabsContent>
            </Tabs>

            <ConfirmationDialogs
              showUpdateConfirmDialog={showUpdateConfirmDialog}
              showCancelDialog={showCancelDialog}
              onCloseUpdateDialog={() => setShowUpdateConfirmDialog(false)}
              onCloseCancelDialog={() => setShowCancelDialog(false)}
              onConfirmUpdate={confirmDateUpdate}
              onConfirmCancel={cancelBilling.mutate}
              isUpdating={updateBilling.isPending}
              isCancelling={cancelBilling.isPending}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
