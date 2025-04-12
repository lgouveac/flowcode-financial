
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
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="address" className="text-sm font-medium">Endereço completo com CEP</Label>
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
          <Label htmlFor="due_date" className="text-sm font-medium">
            {clientType === "pj" 
              ? "Melhor data de vencimento do pagamento"
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
          <Label className="text-sm font-medium">Qual a melhor maneira de pagamento?</Label>
          <RadioGroup
            value={formData.payment_method}
            onValueChange={(value: "pix" | "boleto" | "credit_card") => 
              setFormData({ ...formData, payment_method: value })
            }
            className="grid grid-cols-3 gap-3"
          >
            <div className="flex items-center space-x-2 border rounded-md px-3 py-2 hover:border-primary/50 transition-colors">
              <RadioGroupItem value="pix" id="payment-pix" />
              <Label htmlFor="payment-pix" className="text-sm cursor-pointer">PIX</Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-md px-3 py-2 hover:border-primary/50 transition-colors">
              <RadioGroupItem value="boleto" id="payment-boleto" />
              <Label htmlFor="payment-boleto" className="text-sm cursor-pointer">Boleto</Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-md px-3 py-2 hover:border-primary/50 transition-colors">
              <RadioGroupItem value="credit_card" id="payment-credit-card" />
              <Label htmlFor="payment-credit-card" className="text-sm cursor-pointer">Cartão</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
};
