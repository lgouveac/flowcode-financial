import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import type { Payment } from "@/types/payment";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";

interface PaymentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  billingId?: string;
  payment?: Payment | null;
}

export const PaymentDetailsDialog: React.FC<PaymentDetailsDialogProps> = ({
  open,
  onClose,
  billingId,
  payment: initialPayment,
}) => {
  const [payment, setPayment] = useState<Payment | null>(initialPayment || null);
  const [relatedPayments, setRelatedPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // If a direct payment object is provided, use it
    if (initialPayment) {
      setPayment(initialPayment);
      return;
    }

    // Otherwise, if billingId is provided, fetch the payment data
    if (billingId && open) {
      setLoading(true);
      
      const fetchPaymentData = async () => {
        try {
          // First try to get data from recurring_billing
          const { data: billingData, error: billingError } = await supabase
            .from('recurring_billing')
            .select(`
              *,
              clients (
                name,
                email,
                partner_name
              )
            `)
            .eq('id', billingId)
            .single();
          
          if (!billingError && billingData) {
            // Convert the billing data to a payment format
            const paymentData: Payment = {
              id: billingData.id,
              client_id: billingData.client_id,
              description: billingData.description,
              amount: billingData.amount,
              due_date: new Date(new Date().getFullYear(), new Date().getMonth(), billingData.due_day).toISOString(),
              payment_date: billingData.payment_date,
              payment_method: billingData.payment_method,
              status: billingData.status,
              installment_number: billingData.current_installment,
              total_installments: billingData.installments,
              clients: billingData.clients
            };
            setPayment(paymentData);
            
            // Now fetch all related payments for this recurring billing
            fetchRelatedPayments(billingData.id);
          } else {
            // If not found in recurring_billing, try payments table
            const { data: paymentData, error: paymentError } = await supabase
              .from('payments')
              .select(`
                *,
                clients (
                  name,
                  email,
                  partner_name
                )
              `)
              .eq('id', billingId)
              .single();
            
            if (paymentError) throw paymentError;
            setPayment(paymentData);
          }
        } catch (error) {
          console.error("Error fetching payment:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchPaymentData();
    }
  }, [billingId, initialPayment, open]);

  // Fetch all payments related to this recurring billing
  const fetchRelatedPayments = async (recurringBillingId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          clients (
            name,
            email,
            partner_name
          )
        `)
        .ilike('description', `%${recurringBillingId}%`)
        .order('installment_number', { ascending: true });
      
      if (error) throw error;
      
      // If no related payments were found using the LIKE query, try a different approach
      if (!data || data.length === 0) {
        // Try to find payments that might be related by client_id and similar description
        if (payment) {
          const { data: alternativeData, error: alternativeError } = await supabase
            .from('payments')
            .select(`
              *,
              clients (
                name,
                email,
                partner_name
              )
            `)
            .eq('client_id', payment.client_id)
            .order('created_at', { ascending: false });
          
          if (alternativeError) throw alternativeError;
          setRelatedPayments(alternativeData || []);
        }
      } else {
        setRelatedPayments(data);
      }
    } catch (error) {
      console.error("Error fetching related payments:", error);
    }
  };

  // Reset payment when dialog closes
  useEffect(() => {
    if (!open) {
      setPayment(initialPayment || null);
      setRelatedPayments([]);
    }
  }, [open, initialPayment]);

  // Handle payment status update
  const handleStatusChange = async (paymentId: string, newStatus: "pending" | "billed" | "awaiting_invoice" | "paid" | "overdue" | "cancelled" | "partially_paid") => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: newStatus })
        .eq('id', paymentId);
      
      if (error) throw error;
      
      // Update local state
      setRelatedPayments(prevPayments => 
        prevPayments.map(p => 
          p.id === paymentId ? { ...p, status: newStatus } : p
        )
      );
      
      toast({
        title: "Status atualizado",
        description: "O status do pagamento foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do pagamento.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 dark:bg-green-600">Pago</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Atrasado</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelado</Badge>;
      case 'partially_paid':
        return <Badge className="bg-amber-500 dark:bg-amber-600">Parcialmente Pago</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Show loading or no payment state
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Recebimento</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Carregando dados do recebimento...
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">Carregando...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!payment) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Recebimento</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Não foi possível encontrar dados para este recebimento.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">Nenhum dado de recebimento encontrado.</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Detalhes do Recebimento</DialogTitle>
          <DialogDescription className="text-muted-foreground dark:text-gray-400">
            Informações detalhadas sobre este recebimento
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">ID do Recebimento</TableCell>
                <TableCell>{payment.id}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Cliente</TableCell>
                <TableCell>{payment.clients?.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Valor</TableCell>
                <TableCell>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(payment.amount)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Data de Vencimento</TableCell>
                <TableCell>
                  {format(new Date(payment.due_date), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Status</TableCell>
                <TableCell>{getStatusBadge(payment.status)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Descrição</TableCell>
                <TableCell>{payment.description}</TableCell>
              </TableRow>
              {payment.payment_date && (
                <TableRow>
                  <TableCell className="font-medium">Data de Pagamento</TableCell>
                  <TableCell>
                    {format(new Date(payment.payment_date), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </TableCell>
                </TableRow>
              )}
              {payment.payment_method && (
                <TableRow>
                  <TableCell className="font-medium">Método de Pagamento</TableCell>
                  <TableCell>{payment.payment_method}</TableCell>
                </TableRow>
              )}
              {payment.paid_amount && (
                <TableRow>
                  <TableCell className="font-medium">Valor Pago</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(payment.paid_amount)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Related Payments Section */}
        {relatedPayments.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3 dark:text-white">Parcelas Relacionadas</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {payment.installment_number}/{payment.total_installments}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(payment.amount)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(payment.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={payment.status}
                          onValueChange={(value: "pending" | "billed" | "awaiting_invoice" | "paid" | "overdue" | "cancelled" | "partially_paid") => 
                            handleStatusChange(payment.id, value)
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue>{getStatusBadge(payment.status)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="paid">Pago</SelectItem>
                            <SelectItem value="overdue">Atrasado</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                            <SelectItem value="partially_paid">Parcialmente Pago</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
