
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
        .eq('description', `LIKE %${recurringBillingId}%`)
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
  const handleStatusChange = async (paymentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: newStatus })
        .eq('id', paymentId);
      
      if (error) throw error;
      
      // Update local state
      setRelatedPayments(prevPayments => 
        prevPayments.map(p => 
          p.id === paymentId ? { ...p, status: newStatus as any } : p
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
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  ID do Recebimento
                </td>
                <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                  {payment.id}
                </td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Cliente
                </td>
                <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                  {payment.clients?.name}
                </td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Valor
                </td>
                <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(payment.amount)}
                </td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Data de Vencimento
                </td>
                <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(payment.due_date), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Status
                </td>
                <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                  {payment.status}
                </td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Descrição
                </td>
                <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                  {payment.description}
                </td>
              </tr>
              {payment.payment_date && (
                <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    Data de Pagamento
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(payment.payment_date), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </td>
                </tr>
              )}
              {payment.payment_method && (
                <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    Método de Pagamento
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                    {payment.payment_method}
                  </td>
                </tr>
              )}
              {payment.paid_amount && (
                <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    Valor Pago
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(payment.paid_amount)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Related Payments Section */}
        {relatedPayments.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3 dark:text-white">Parcelas Relacionadas</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Parcela
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {relatedPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {payment.installment_number}/{payment.total_installments}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(payment.amount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(payment.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <Select
                          value={payment.status}
                          onValueChange={(value) => handleStatusChange(payment.id, value)}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
