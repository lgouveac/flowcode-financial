
import type { RecurringBilling } from "@/types/billing";

interface BillingTableProps {
  billings: Array<RecurringBilling & { clients?: { name: string } }>;
}

export const BillingTable = ({ billings }: BillingTableProps) => {
  return (
    <div className="rounded-lg border">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <th className="p-4 font-medium">Cliente</th>
            <th className="p-4 font-medium">Descrição</th>
            <th className="p-4 font-medium">Valor</th>
            <th className="p-4 font-medium">Vencimento</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 font-medium">Método</th>
          </tr>
        </thead>
        <tbody>
          {billings.map((billing) => (
            <tr key={billing.id} className="border-t">
              <td className="p-4">{billing.clients?.name}</td>
              <td className="p-4">{billing.description}</td>
              <td className="p-4">R$ {billing.amount.toFixed(2)}</td>
              <td className="p-4">Dia {billing.due_day}</td>
              <td className="p-4">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  billing.status === 'paid' 
                    ? 'bg-green-100 text-green-800'
                    : billing.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : billing.status === 'overdue'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {billing.status === 'paid' ? 'Pago'
                    : billing.status === 'pending' ? 'Pendente'
                    : billing.status === 'overdue' ? 'Atrasado'
                    : 'Cancelado'}
                </span>
              </td>
              <td className="p-4">
                {billing.payment_method === 'pix' ? 'PIX'
                  : billing.payment_method === 'boleto' ? 'Boleto'
                  : 'Cartão de Crédito'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
