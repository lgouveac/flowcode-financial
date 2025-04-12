
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function PublicEmployeeForm() {
  const [contractType, setContractType] = useState<"pf" | "pj">("pj");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/thank-you";
  
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
    email_recipient: ""
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
        description: "Seus dados foram enviados com sucesso.",
      });

      // Redirect to thank you page or specified redirect URL
      navigate(redirectUrl);
      
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        title: "Erro ao enviar formulário",
        description: error.message || "Ocorreu um erro ao enviar o formulário. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-3xl py-8 px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Formulário de Cadastro</h1>
          <p className="text-gray-600 mt-2">Por favor, preencha os dados abaixo para completar seu cadastro.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-base font-medium mb-2">Você contratará como pessoa física ou jurídica?</p>
              <RadioGroup
                value={contractType}
                onValueChange={(value: "pf" | "pj") => setContractType(value)}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2 border rounded-md px-16 py-2">
                  <RadioGroupItem value="pf" id="contract-pf" />
                  <Label htmlFor="contract-pf">Pessoa Física (PF)</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md px-16 py-2">
                  <RadioGroupItem value="pj" id="contract-pj" />
                  <Label htmlFor="contract-pj">Pessoa Jurídica (PJ)</Label>
                </div>
              </RadioGroup>
            </div>

            {contractType === "pj" ? (
              <>
                <div className="space-y-2">
                  <Label className="text-gray-700" htmlFor="company_name">Razão Social da Empresa</Label>
                  <input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange("company_name", e.target.value)}
                    placeholder="Nome da empresa"
                    required
                    className="w-full p-2 rounded-md border border-gray-300 bg-gray-100"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="cnpj">CNPJ</Label>
                    <input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => handleInputChange("cnpj", e.target.value)}
                      placeholder="00.000.000/0001-00"
                      required
                      className="w-full p-2 rounded-md border border-gray-300 bg-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="email">Email</Label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="empresa@exemplo.com"
                      required
                      className="w-full p-2 rounded-md border border-gray-300 bg-gray-100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="partner_name">Nome completo do sócio</Label>
                    <input
                      id="partner_name"
                      value={formData.partner_name}
                      onChange={(e) => handleInputChange("partner_name", e.target.value)}
                      placeholder="Nome do sócio"
                      required
                      className="w-full p-2 rounded-md border border-gray-300 bg-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700" htmlFor="partner_cpf">CPF do sócio</Label>
                    <input
                      id="partner_cpf"
                      value={formData.partner_cpf}
                      onChange={(e) => handleInputChange("partner_cpf", e.target.value)}
                      placeholder="000.000.000-00"
                      required
                      className="w-full p-2 rounded-md border border-gray-300 bg-gray-100"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700" htmlFor="name">Nome completo</Label>
                  <input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Seu nome completo"
                    required
                    className="w-full p-2 rounded-md border border-gray-300 bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700" htmlFor="cpf">CPF</Label>
                  <input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                    required
                    className="w-full p-2 rounded-md border border-gray-300 bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700" htmlFor="email">Email</Label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full p-2 rounded-md border border-gray-300 bg-gray-100"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-gray-700" htmlFor="phone">Telefone</Label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="(00) 00000-0000"
                required
                className="w-full p-2 rounded-md border border-gray-300 bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700" htmlFor="email_recipient">Nome do responsável</Label>
              <input
                id="email_recipient"
                value={formData.email_recipient}
                onChange={(e) => handleInputChange("email_recipient", e.target.value)}
                placeholder="Se for diferente do sócio"
                className="w-full p-2 rounded-md border border-gray-300 bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700" htmlFor="address">Endereço completo com CEP</Label>
              <input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Rua, número, complemento, bairro, cidade - UF, CEP"
                required
                className="w-full p-2 rounded-md border border-gray-300 bg-gray-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700" htmlFor="due_date">
                  Melhor data de vencimento do pagamento
                </Label>
                <input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange("due_date", e.target.value)}
                  required
                  className="w-full p-2 rounded-md border border-gray-300 bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Qual a melhor maneira de pagamento?</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center space-x-2 border rounded-md px-3 py-2">
                    <input
                      type="radio"
                      id="payment-pix"
                      name="payment_method"
                      value="pix"
                      checked={formData.payment_method === "pix"}
                      onChange={() => handleInputChange("payment_method", "pix")}
                      className="text-primary"
                    />
                    <label htmlFor="payment-pix" className="text-sm cursor-pointer">PIX</label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md px-3 py-2">
                    <input
                      type="radio"
                      id="payment-boleto"
                      name="payment_method"
                      value="boleto"
                      checked={formData.payment_method === "boleto"}
                      onChange={() => handleInputChange("payment_method", "boleto")}
                      className="text-primary"
                    />
                    <label htmlFor="payment-boleto" className="text-sm cursor-pointer">Boleto</label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md px-3 py-2">
                    <input
                      type="radio"
                      id="payment-credit-card"
                      name="payment_method"
                      value="credit_card"
                      checked={formData.payment_method === "credit_card"}
                      onChange={() => handleInputChange("payment_method", "credit_card")}
                      className="text-primary"
                    />
                    <label htmlFor="payment-credit-card" className="text-sm cursor-pointer">Cartão</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md font-medium"
            >
              {isSubmitting ? "Enviando..." : "Enviar Cadastro"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
