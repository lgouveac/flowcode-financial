
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface BillingDetailsProps {
  description: string;
  amount: string | number;
  installments: string | number;
  dueDay: string | number;
  startDate: string;
  endDate: string;
  onUpdate: (field: string, value: string | number) => void;
  disabled?: boolean;
}

export function BillingDetails({
  description,
  amount,
  installments,
  dueDay,
  startDate,
  endDate,
  onUpdate,
  disabled = false
}: BillingDetailsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Input 
          id="description"
          value={description}
          onChange={(e) => onUpdate('description', e.target.value)}
          placeholder="Descrição do recebimento"
          disabled={disabled}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="amount">Valor (R$)</Label>
        <Input 
          id="amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => onUpdate('amount', parseFloat(e.target.value))}
          placeholder="0,00"
          disabled={disabled}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="installments">Parcelas</Label>
        <Input 
          id="installments"
          type="number"
          min="1"
          value={installments}
          onChange={(e) => onUpdate('installments', parseInt(e.target.value))}
          placeholder="1"
          disabled={disabled}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="due_day">Dia de vencimento</Label>
        <Input 
          id="due_day"
          type="number"
          min="1"
          max="31"
          value={dueDay}
          onChange={(e) => onUpdate('due_day', parseInt(e.target.value))}
          placeholder="1"
          disabled={disabled}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="start_date">Data de início</Label>
        <Input 
          id="start_date"
          type="date"
          value={startDate}
          onChange={(e) => onUpdate('start_date', e.target.value)}
          disabled={disabled}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="end_date">Data de término (opcional)</Label>
        <Input 
          id="end_date"
          type="date"
          value={endDate}
          onChange={(e) => onUpdate('end_date', e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
