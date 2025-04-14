import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect } from "react";
import type { Payment } from "@/types/payment";

interface PaymentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  payment: Payment | null;
}

export const PaymentDetailsDialog: React.FC<PaymentDetailsDialogProps> = ({
  open,
  onClose,
  payment,
}) => {
  useEffect(() => {
    if (payment) {
      console.log("Payment details:", payment);
    }
  }, [payment]);

  if (!payment) {
    return null;
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
              {payment.notes && (
                <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    Observações
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                    {payment.notes}
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
