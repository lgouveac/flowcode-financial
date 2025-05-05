
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaymentMethodSelectorProps {
  value: 'pix' | 'boleto' | 'credit_card';
  onChange: (value: 'pix' | 'boleto' | 'credit_card') => void;
}

export const PaymentMethodSelector = ({ value, onChange }: PaymentMethodSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label>Método de Pagamento</Label>
      <Select 
        defaultValue={value}
        onValueChange={(value: 'pix' | 'boleto' | 'credit_card') => {
          console.log("Payment method changed:", value);
          onChange(value);
        }}
      >
        <SelectTrigger className="bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pix">PIX</SelectItem>
          <SelectItem value="boleto">Boleto</SelectItem>
          <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
