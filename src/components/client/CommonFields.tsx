
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
          <Label htmlFor="responsavel_financeiro" className="text-sm font-medium">Responsável Financeiro</Label>
          <Input
            id="responsavel_financeiro"
            value={formData.responsavel_financeiro || ""}
            onChange={(e) => setFormData({ ...formData, responsavel_financeiro: e.target.value })}
            placeholder="Nome do responsável pelo financeiro"
            className="w-full"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email_financeiro" className="text-sm font-medium">Email Financeiro</Label>
          <Input
            id="email_financeiro"
            type="email"
            value={formData.email_financeiro || ""}
            onChange={(e) => setFormData({ ...formData, email_financeiro: e.target.value })}
            placeholder="email.financeiro@empresa.com"
            className="w-full"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label className="text-sm font-medium">Qual a melhor maneira de pagamento?</Label>
        <RadioGroup
          value={formData.payment_method}
          onValueChange={(value: "pix" | "boleto") =>
            setFormData({ ...formData, payment_method: value as "pix" | "boleto" })
          }
          className="grid grid-cols-2 gap-3"
        >
          <div className="flex items-center space-x-2 border rounded-md px-3 py-2 hover:border-primary/50 transition-colors">
            <RadioGroupItem value="pix" id="payment-pix" />
            <Label htmlFor="payment-pix" className="text-sm cursor-pointer">PIX</Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-md px-3 py-2 hover:border-primary/50 transition-colors">
            <RadioGroupItem value="boleto" id="payment-boleto" />
            <Label htmlFor="payment-boleto" className="text-sm cursor-pointer">Boleto</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};
