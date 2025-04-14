
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PaymentTable } from "@/components/payments/PaymentTable";
import { Payment } from "@/types/payment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Clock, DollarSign, Info, Repeat, User } from "lucide-react";
import { formatCurrency } from "@/components/payments/utils/formatUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface PaymentDetailsDialogProps {
  billingId: string;
  open: boolean;
  onClose: () => void;
}

export const PaymentDetailsDialog = ({ billingId, open, onClose }: PaymentDetailsDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [billingDetails, setBillingDetails] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [showPartialPaymentDialog, setShowPartialPaymentDialog] = useState(false);
  const [partialAmount, setPartialAmount] = useState<string>("");
  const [processingStatus, setProcessingStatus] = useState(false);
  const [processingPartial, setProcessingPartial] = useState(false);

  useEffect(() => {
    if (open && billingId) {
      fetchBillingDetails();
    }
  }, [open, billingId]);

  // Add useEffect to fetch payments after billing details are loaded
  useEffect(() => {
    if (billingDetails && billingDetails.client_id) {
      fetchPaymentsForBilling();
    }
  }, [billingDetails]);

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
            phone,
            responsible_name
          )
        `)
        .eq('id', billingId)
        .single();

      if (error) throw error;
      setBillingDetails(data);
      console.log("Billing details loaded:", data);
    } catch (error) {
      console.error("Error fetching billing details:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do recebimento recorrente.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const fetchPaymentsForBilling = async () => {
    try {
      console.log("Fetching payments for client_id:", billingDetails.client_id);
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          clients(name, email)
        `)
        .eq('client_id', billingDetails.client_id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      // Filter payments related to this recurring billing by matching the description pattern
      const relatedPayments = data.filter(payment => 
        payment.description.includes(billingDetails.description) && 
        payment.installment_number !== null
      );
      
      console.log("Filtered payments:", relatedPayments);
      setPayments(relatedPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pagamentos relacionados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStatusDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setNewStatus(payment.status || "pending");
    setPaymentDate(payment.payment_date ? new Date(payment.payment_date) : new Date());
    setShowStatusDialog(true);
  };

  const handleOpenPartialPaymentDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setPartialAmount(payment.paid_amount?.toString() || "");
    setPaymentDate(payment.payment_date ? new Date(payment.payment_date) : new Date());
    setShowPartialPaymentDialog(true);
  };

  const handleStatusChange = async () => {
    if (!selectedPayment) return;
    
    setProcessingStatus(true);
    
    try {
      // Create cash flow entry if status is changed to 'paid'
      if (newStatus === 'paid') {
        // First, update the payment
        const { error: paymentError } = await supabase
          .from('payments')
          .update({ 
            status: newStatus,
            payment_date: paymentDate?.toISOString().split('T')[0]
          })
          .eq('id', selectedPayment.id);

        if (paymentError) throw paymentError;

        // Then create the cash flow entry
        const { error: cashFlowError } = await supabase
          .from('cash_flow')
          .insert({
            type: 'income',
            description: selectedPayment.description,
            amount: selectedPayment.amount,
            date: paymentDate?.toISOString().split('T')[0],
            category: 'payment',
            payment_id: selectedPayment.id,
            status: 'approved'
          });

        if (cashFlowError) {
          console.error("Error creating cash flow entry:", cashFlowError);
          toast({
            title: "Aviso",
            description: "Pagamento marcado como pago, mas houve erro ao registrar no fluxo de caixa.",
            variant: "destructive",
          });
        }
      } else {
        // Just update the payment status if not 'paid'
        const { error } = await supabase
          .from('payments')
          .update({ 
            status: newStatus,
            payment_date: newStatus === 'pending' || newStatus === 'awaiting_invoice' || newStatus === 'billed' ? null : paymentDate?.toISOString().split('T')[0]
          })
          .eq('id', selectedPayment.id);

        if (error) throw error;
      }

      toast({
        title: "Status atualizado",
        description: "O status do pagamento foi atualizado com sucesso.",
      });

      // Refresh payments list
      fetchPaymentsForBilling();
      setShowStatusDialog(false);
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do pagamento.",
        variant: "destructive",
      });
    } finally {
      setProcessingStatus(false);
    }
  };

  const handlePartialPaymentSubmit = async () => {
    if (!selectedPayment) return;
    
    const partialAmountNumber = parseFloat(partialAmount);
    
    if (isNaN(partialAmountNumber) || partialAmountNumber <= 0 || partialAmountNumber >= selectedPayment.amount) {
      toast({
        title: "Valor inválido",
        description: "O valor deve ser maior que zero e menor que o valor total.",
        variant: "destructive",
      });
      return;
    }
    
    setProcessingPartial(true);
    
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'partially_paid',
          paid_amount: partialAmountNumber,
          payment_date: paymentDate?.toISOString().split('T')[0]
        })
        .eq('id', selectedPayment.id);

      if (error) throw error;

      toast({
        title: "Pagamento parcial registrado",
        description: "O pagamento parcial foi registrado com sucesso.",
      });

      // Refresh payments list
      fetchPaymentsForBilling();
      setShowPartialPaymentDialog(false);
    } catch (error) {
      console.error("Error registering partial payment:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento parcial.",
        variant: "destructive",
      });
    } finally {
      setProcessingPartial(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'partially_paid':
        return 'warning';
      case 'overdue':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      case 'billed':
        return 'info';
      case 'awaiting_invoice':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      pending: 'Pendente',
      billed: 'Faturado',
      awaiting_invoice: 'Aguardando Fatura',
      paid: 'Pago',
      partially_paid: 'Pago Parcial',
      overdue: 'Atrasado',
      cancelled: 'Cancelado'
    };
    return statusLabels[status] || status;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodLabels: Record<string, string> = {
      pix: 'PIX',
      boleto: 'Boleto',
      credit_card: 'Cartão de Crédito'
    };
    return methodLabels[method] || method;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Recebimento Recorrente</DialogTitle>
        </DialogHeader>

        {billingDetails ? (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Informações Gerais</CardTitle>
                <CardDescription>Detalhes do recebimento recorrente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">Cliente</h3>
                    </div>
                    <p>{billingDetails.clients?.name}</p>
                    <p className="text-sm text-muted-foreground">{billingDetails.clients?.email}</p>
                    {billingDetails.clients?.phone && (
                      <p className="text-sm text-muted-foreground">{billingDetails.clients?.phone}</p>
                    )}
                    {billingDetails.clients?.responsible_name && (
                      <p className="text-sm mt-1">
                        <span className="font-medium">Responsável:</span> {billingDetails.clients?.responsible_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">Descrição</h3>
                    </div>
                    <p>{billingDetails.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getStatusBadgeVariant(billingDetails.status)}>
                        {getStatusLabel(billingDetails.status)}
                      </Badge>
                      <Badge variant="outline">
                        {getPaymentMethodLabel(billingDetails.payment_method)}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">Valor e Parcelas</h3>
                    </div>
                    <p className="text-lg font-medium">{formatCurrency(billingDetails.amount)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Repeat className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Parcela {billingDetails.current_installment} de {billingDetails.installments}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">Datas</h3>
                    </div>
                    <div className="space-y-1">
                      <p>
                        <span className="text-muted-foreground">Dia de vencimento:</span> {billingDetails.due_day}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Data de início:</span>{" "}
                        {billingDetails.start_date ? format(new Date(billingDetails.start_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </p>
                      {billingDetails.payment_date && (
                        <p>
                          <span className="text-muted-foreground">Último pagamento:</span>{" "}
                          {format(new Date(billingDetails.payment_date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            <h2 className="text-lg font-semibold">Pagamentos</h2>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="bg-white rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descrição</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vencimento</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Valor</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pago em</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                          Nenhum pagamento encontrado.
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment) => (
                        <tr key={payment.id} className="border-t">
                          <td className="px-4 py-3">{payment.description}</td>
                          <td className="px-4 py-3">
                            {payment.due_date ? format(new Date(payment.due_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                          </td>
                          <td className="px-4 py-3">
                            {payment.status === 'partially_paid' && payment.paid_amount ? (
                              <div>
                                <div>{formatCurrency(payment.amount)}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Pago: {formatCurrency(payment.paid_amount)} | 
                                  Restante: {formatCurrency(payment.amount - payment.paid_amount)}
                                </div>
                              </div>
                            ) : (
                              formatCurrency(payment.amount)
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={getStatusBadgeVariant(payment.status)}>
                              {getStatusLabel(payment.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {payment.payment_date ? format(new Date(payment.payment_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleOpenStatusDialog(payment)}
                              >
                                Alterar status
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleOpenPartialPaymentDialog(payment)}
                                disabled={payment.status === 'paid' || payment.status === 'cancelled'}
                              >
                                Pagamento parcial
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {/* Status change dialog */}
        <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alterar Status do Pagamento</AlertDialogTitle>
              <AlertDialogDescription>
                Selecione o novo status para este pagamento.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newStatus}
                  onValueChange={setNewStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
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
              </div>
              
              {(newStatus === 'paid' || newStatus === 'partially_paid' || newStatus === 'overdue') && (
                <div className="space-y-2">
                  <Label>Data do Pagamento/Ocorrência</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {paymentDate ? format(paymentDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={paymentDate}
                        onSelect={(date) => setPaymentDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleStatusChange}
                disabled={processingStatus}
              >
                {processingStatus ? "Salvando..." : "Salvar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Partial payment dialog */}
        <AlertDialog open={showPartialPaymentDialog} onOpenChange={setShowPartialPaymentDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Registrar Pagamento Parcial</AlertDialogTitle>
              <AlertDialogDescription>
                Informe o valor recebido para registrar um pagamento parcial.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Valor Total</Label>
                <div className="px-3 py-2 border rounded-md bg-muted/50">
                  {selectedPayment ? formatCurrency(selectedPayment.amount) : "R$ 0,00"}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="partial-amount">Valor Recebido</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">R$</span>
                  <Input 
                    id="partial-amount" 
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    max={selectedPayment ? selectedPayment.amount - 0.01 : 9999999}
                    className="pl-8" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Data de Pagamento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentDate ? format(paymentDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={paymentDate}
                      onSelect={(date) => setPaymentDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Valor Restante</Label>
                <div className="px-3 py-2 border rounded-md bg-muted/50">
                  {selectedPayment && !isNaN(parseFloat(partialAmount)) ? 
                    formatCurrency(selectedPayment.amount - parseFloat(partialAmount)) : 
                    "R$ 0,00"}
                </div>
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handlePartialPaymentSubmit}
                disabled={processingPartial || !partialAmount || isNaN(parseFloat(partialAmount)) || parseFloat(partialAmount) <= 0 || (selectedPayment && parseFloat(partialAmount) >= selectedPayment.amount)}
              >
                {processingPartial ? "Salvando..." : "Salvar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};
