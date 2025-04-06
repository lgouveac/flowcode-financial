
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmployeeRegistrationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const EmployeeRegistrationForm = ({ onSuccess, onCancel }: EmployeeRegistrationFormProps) => {
  const { toast } = useToast();
  const [contractType, setContractType] = useState<"pf" | "pj">("pj");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Common fields
    name: "",
    email: "",
    phone: "",
    address: "",
    payment_method: "pix" as "pix" | "boleto" | "credit_card",
    due_date: "",
    
    // PJ fields
    cnpj: "",
    partner_name: "",
    partner_cpf: "",
    company_name: "",
    
    // PF fields
    cpf: "",
    
    // Email recipient
    email_recipient: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare employee data
      const employeeData = {
        name: contractType === "pj" ? formData.company_name : formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        payment_method: formData.payment_method,
        type: contractType,
        status: "active",
        cnpj: contractType === "pj" ? formData.cnpj : null,
        // We'll store additional PJ or PF data as metadata
        metadata: contractType === "pj" 
          ? {
              partner_name: formData.partner_name,
              partner_cpf: formData.partner_cpf,
              email_recipient: formData.email_recipient || formData.partner_name
            }
          : {
              cpf: formData.cpf,
              email_recipient: formData.email_recipient || formData.name
            }
      };

      const { error } = await supabase
        .from('employees')
        .insert([employeeData]);

      if (error) throw error;

      toast({
        title: "Funcionário registrado",
        description: "O funcionário foi registrado com sucesso.",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error registering employee:", error);
      toast({
        title: "Erro ao registrar funcionário",
        description: error.message || "Ocorreu um erro ao registrar o funcionário.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Você contratará como pessoa física ou jurídica?</Label>
          <RadioGroup
            value={contractType}
            onValueChange={(value: "pf" | "pj") => setContractType(value)}
            className="flex gap-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pj" id="contract-pj" />
              <Label htmlFor="contract-pj">Pessoa Jurídica (PJ)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pf" id="contract-pf" />
              <Label htmlFor="contract-pf">Pessoa Física (PF)</Label>
            </div>
          </RadioGroup>
        </div>

        {contractType === "pj" ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange("cnpj", e.target.value)}
                  placeholder="00.000.000/0001-00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name">Razão Social da Empresa</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="partner_name">Nome completo do sócio</Label>
                <Input
                  id="partner_name"
                  value={formData.partner_name}
                  onChange={(e) => handleInputChange("partner_name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner_cpf">CPF do sócio</Label>
                <Input
                  id="partner_cpf"
                  value={formData.partner_cpf}
                  onChange={(e) => handleInputChange("partner_cpf", e.target.value)}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => handleInputChange("cpf", e.target.value)}
                placeholder="000.000.000-00"
                required
              />
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">WhatsApp</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="(00) 00000-0000"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Endereço completo com CEP</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            placeholder="Rua, número, complemento, bairro, cidade - UF, CEP"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="due_date">
              {contractType === "pj" 
                ? "Melhor data de vencimento do pagamento ou data da primeira parcela"
                : "Melhor data de vencimento do pagamento"
              }
            </Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleInputChange("due_date", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Qual a melhor maneira de pagamento?</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value: "pix" | "boleto" | "credit_card") => 
                handleInputChange("payment_method", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="credit_card">Cartão de crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email_recipient">Nome de quem vai receber o e-mail</Label>
          <Input
            id="email_recipient"
            value={formData.email_recipient}
            onChange={(e) => handleInputChange("email_recipient", e.target.value)}
            placeholder={contractType === "pj" ? "Se diferente do sócio" : "Se diferente do nome completo"}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Registrando..." : "Registrar Funcionário"}
        </Button>
      </div>
    </form>
  );
};
