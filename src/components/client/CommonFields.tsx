
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { NewClient } from "@/types/client";

interface CommonFieldsProps {
  formData: NewClient;
  setFormData: (data: NewClient) => void;
  clientType: "pf" | "pj";
}

export const CommonFields = ({ formData, setFormData, clientType }: CommonFieldsProps) => {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="address">Endereço completo com CEP</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
          placeholder="Rua, número, complemento, bairro, cidade - UF, CEP"
          className="w-full"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="due_date">
            {clientType === "pj" 
              ? "Melhor data de vencimento do pagamento ou data da primeira parcela"
              : "Melhor data de vencimento do pagamento"
            }
          </Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label>Qual a melhor maneira de pagamento?</Label>
          <RadioGroup
            value={formData.payment_method}
            onValueChange={(value: "pix" | "boleto" | "credit_card") => 
              setFormData({ ...formData, payment_method: value })
            }
            className="grid grid-cols-3 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pix" id="payment-pix" />
              <Label htmlFor="payment-pix">PIX</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="boleto" id="payment-boleto" />
              <Label htmlFor="payment-boleto">Boleto</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="credit_card" id="payment-credit-card" />
              <Label htmlFor="payment-credit-card">Cartão de crédito</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
};
