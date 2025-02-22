import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { NewClient } from "@/types/client";

interface NewClientFormProps {
  onSubmit: (client: NewClient) => void;
  onClose: () => void;
}

export const NewClientForm = ({ onSubmit, onClose }: NewClientFormProps) => {
  const [clientType, setClientType] = useState<"pf" | "pj">("pj");
  const [formData, setFormData] = useState<NewClient>({
    name: "",
    email: "",
    type: "pj",
    company_name: "",
    cnpj: "",
    partner_name: "",
    partner_cpf: "",
    address: "",
    due_date: "",
    payment_method: "pix",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full"
          />
        </div>

        <div className="grid gap-2">
          <Label>Você contratará como pessoa física ou jurídica?</Label>
          <RadioGroup
            value={clientType}
            onValueChange={(value: "pf" | "pj") => {
              setClientType(value);
              setFormData({ ...formData, type: value });
            }}
            className="grid sm:grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pf" id="pf" />
              <Label htmlFor="pf">PF</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pj" id="pj" />
              <Label htmlFor="pj">PJ</Label>
            </div>
          </RadioGroup>
        </div>

        {clientType === "pj" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="company_name">Razão Social da Empresa</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cnpj">Qual seu CNPJ?</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                required
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="partner_name">Nome completo do sócio</Label>
              <Input
                id="partner_name"
                value={formData.partner_name}
                onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="partner_cpf">CPF do sócio</Label>
              <Input
                id="partner_cpf"
                value={formData.partner_cpf}
                onChange={(e) => setFormData({ ...formData, partner_cpf: e.target.value })}
                required
                placeholder="000.000.000-00"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Qual seu nome completo?</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                required
                placeholder="000.000.000-00"
              />
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        <div className="grid gap-2">
          <Label>Qual a melhor maneira de pagamento?</Label>
          <RadioGroup
            value={formData.payment_method}
            onValueChange={(value: "pix" | "boleto" | "credit_card") => 
              setFormData({ ...formData, payment_method: value })
            }
            className="grid sm:grid-cols-3 gap-4"
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

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar
        </Button>
      </div>
    </form>
  );
};
