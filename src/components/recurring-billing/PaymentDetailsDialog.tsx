
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { BillingDetails } from "./BillingDetails";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle, Edit2, Save, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { type RecurringBilling } from "@/types/billing";
import { type Payment } from "@/types/payment";
import { Badge } from "@/components/ui/badge";

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
      
      setIsEditing(false);
      fetchBillingDetails();
    } catch (error) {
      console.error('Error updating billing details:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as informações do recebimento.",
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Atrasado</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500">Cancelado</Badge>;
      case 'partially_paid':
        return <Badge className="bg-blue-500">Pago Parcial</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
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
    }
  }, [open]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Atrasado</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500">Cancelado</Badge>;
      case 'partially_paid':
        return <Badge className="bg-blue-500">Pago Parcial</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

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
              
              <BillingDetails 
                billingData={isEditing ? null : billingData}
                description={isEditing ? editedBillingData.description : undefined}
                amount={isEditing ? editedBillingData.amount : undefined}
                installments={isEditing ? editedBillingData.installments : undefined}
                dueDay={isEditing ? editedBillingData.due_day : undefined}
                startDate={isEditing ? editedBillingData.start_date : undefined}
                endDate={isEditing ? editedBillingData.end_date : undefined}
                onUpdate={isEditing ? updateBillingField : undefined}
                darkMode={true}
              />

              <div className="border-t border-border/50 pt-4">
                <h3 className="text-lg font-medium mb-4">Pagamentos Associados</h3>
                
                {paymentsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : payments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pago em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.description}</TableCell>
                          <TableCell>{formatDate(payment.due_date)}</TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell>{payment.payment_date ? formatDate(payment.payment_date) : '-'}</TableCell>
                          <TableCell>
                            {payment.status !== 'paid' && payment.status !== 'cancelled' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setPaymentToUpdate(payment.id)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                Marcar como pago
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhum pagamento associado encontrado.
                  </div>
                )}
              </div>
              
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

      {/* Confirm Dialog for Marking Billing as Paid */}
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
            <AlertDialogAction onClick={handleMarkBillingAsPaid}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Dialog for Marking Payment as Paid */}
      <AlertDialog 
        open={!!paymentToUpdate} 
        onOpenChange={(open) => !open && setPaymentToUpdate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar este pagamento como pago? 
              Esta ação também registrará o pagamento no fluxo de caixa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => paymentToUpdate && handleMarkPaymentAsPaid(paymentToUpdate)}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
