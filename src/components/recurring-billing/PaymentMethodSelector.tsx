
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (value: 'pix' | 'boleto' | 'credit_card') => void;
  disabled?: boolean;
}

export function PaymentMethodSelector({ value, onChange, disabled = false }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="payment_method">Método de Pagamento</Label>
      <Select 
        value={value} 
        onValueChange={(value: 'pix' | 'boleto' | 'credit_card') => onChange(value)}
        disabled={disabled}
      >
        <SelectTrigger id="payment_method">
          <SelectValue placeholder="Selecione o método de pagamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pix">PIX</SelectItem>
          <SelectItem value="boleto">Boleto</SelectItem>
          <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
