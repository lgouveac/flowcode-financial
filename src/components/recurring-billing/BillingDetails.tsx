
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface BillingDetailsProps {
  description: string;
  amount: number | '';
  installments: number | '';
  dueDay: number | '';
  startDate: string;
  endDate: string;
  onUpdate: (field: string, value: string | number) => void;
}

export const BillingDetails = ({
  description,
  amount,
  installments,
  dueDay,
  startDate,
  endDate,
  onUpdate
}: BillingDetailsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input
          value={description}
          onChange={(e) => {
            console.log("Description changed:", e.target.value);
            onUpdate('description', e.target.value);
          }}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor</Label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => {
              console.log("Amount changed:", e.target.value);
              onUpdate('amount', parseFloat(e.target.value));
            }}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Parcelas</Label>
          <Input
            type="number"
            min="1"
            value={installments}
            onChange={(e) => {
              console.log("Installments changed:", e.target.value);
              onUpdate('installments', parseInt(e.target.value));
            }}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Dia do Vencimento</Label>
          <Input
            type="number"
            min="1"
            max="31"
            value={dueDay}
            onChange={(e) => {
              console.log("Due day changed:", e.target.value);
              onUpdate('due_day', parseInt(e.target.value));
            }}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de Início</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              console.log("Start date changed:", e.target.value);
              onUpdate('start_date', e.target.value);
            }}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Data Final (opcional)</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onUpdate('end_date', e.target.value)}
          />
        </div>
      </div>
    </>
  );
};
