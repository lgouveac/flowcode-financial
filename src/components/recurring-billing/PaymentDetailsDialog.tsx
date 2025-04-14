import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import type { Payment } from "@/types/payment";
import { supabase } from "@/integrations/supabase/client";

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
  const [loading, setLoading] = useState(false);

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
            .eq('id', billingId)
            .single();
          
          if (error) throw error;
          
          setPayment(data);
        } catch (error) {
          console.error("Error fetching payment:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchPaymentData();
    }
  }, [billingId, initialPayment, open]);

  // Reset payment when dialog closes
  useEffect(() => {
    if (!open) {
      setPayment(initialPayment || null);
    }
  }, [open, initialPayment]);

  // Show loading or no payment state
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Recebimento</DialogTitle>
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
          </DialogHeader>
          <div className="py-6 text-center">Nenhum dado de recebimento encontrado.</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Recebimento</DialogTitle>
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
              {/* Only show notes if property exists */}
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
      </DialogContent>
    </Dialog>
  );
};
