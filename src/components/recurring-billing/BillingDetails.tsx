
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface BillingDetailsProps {
  billingData?: any;
  description?: string;
  amount?: number | '';
  installments?: number | '';
  dueDay?: number | '';
  startDate?: string;
  endDate?: string;
  onUpdate?: (field: string, value: string | number) => void;
}

export const BillingDetails = ({
  billingData,
  description,
  amount,
  installments,
  dueDay,
  startDate,
  endDate,
  onUpdate
}: BillingDetailsProps) => {
  // If billingData is provided, use that, otherwise use individual props
  const data = billingData || {
    description,
    amount,
    installments,
    due_day: dueDay,
    start_date: startDate,
    end_date: endDate,
  };
  
  // Function to handle updates if onUpdate is provided
  const handleUpdate = (field: string, value: string | number) => {
    if (onUpdate) {
      console.log(`${field} changed:`, value);
      onUpdate(field, value);
    }
  };

  // Read-only mode if no onUpdate provided
  const isReadOnly = !onUpdate;

  return (
    <>
      <div className="space-y-2">
        <Label>Descrição</Label>
        {isReadOnly ? (
          <p className="p-2 border rounded-md bg-gray-50">{data.description}</p>
        ) : (
          <Input
            value={data.description}
            onChange={(e) => handleUpdate('description', e.target.value)}
            required
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor</Label>
          {isReadOnly ? (
            <p className="p-2 border rounded-md bg-gray-50">
              {typeof data.amount === 'number' 
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.amount) 
                : data.amount}
            </p>
          ) : (
            <Input
              type="number"
              step="0.01"
              value={data.amount}
              onChange={(e) => handleUpdate('amount', parseFloat(e.target.value))}
              required
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>Parcelas</Label>
          {isReadOnly ? (
            <p className="p-2 border rounded-md bg-gray-50">{data.installments || data.installments === 0 ? data.installments : '-'}</p>
          ) : (
            <Input
              type="number"
              min="1"
              value={data.installments}
              onChange={(e) => handleUpdate('installments', parseInt(e.target.value))}
              required
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Dia do Vencimento</Label>
          {isReadOnly ? (
            <p className="p-2 border rounded-md bg-gray-50">{data.due_day || '-'}</p>
          ) : (
            <Input
              type="number"
              min="1"
              max="31"
              value={data.due_day}
              onChange={(e) => handleUpdate('due_day', parseInt(e.target.value))}
              required
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de Início</Label>
          {isReadOnly ? (
            <p className="p-2 border rounded-md bg-gray-50">{data.start_date || '-'}</p>
          ) : (
            <Input
              type="date"
              value={data.start_date}
              onChange={(e) => handleUpdate('start_date', e.target.value)}
              required
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>Data Final (opcional)</Label>
          {isReadOnly ? (
            <p className="p-2 border rounded-md bg-gray-50">{data.end_date || '-'}</p>
          ) : (
            <Input
              type="date"
              value={data.end_date}
              onChange={(e) => handleUpdate('end_date', e.target.value)}
            />
          )}
        </div>
      </div>
    </>
  );
};
