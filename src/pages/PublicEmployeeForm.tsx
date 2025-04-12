
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function PublicEmployeeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentType, setPaymentType] = useState<"pix" | "boleto" | "credit_card">("pix");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/thank-you";
  
  const [formData, setFormData] = useState({
    // PJ fields
    company_name: "",
    cnpj: "",
    email: "",
    partner_name: "",
    partner_cpf: "",
    
    // Common fields
    phone: "",
    email_recipient: "",
    address: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!selectedDate) {
        throw new Error("Por favor, selecione uma data de vencimento.");
      }

      // Prepare employee data
      const employeeData = {
        name: formData.company_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        payment_method: paymentType,
        due_date: format(selectedDate, 'yyyy-MM-dd'),
        type: "pj", // We're only supporting PJ in the form
        status: "active",
        cnpj: formData.cnpj,
        // Additional PJ data as metadata
        metadata: {
          partner_name: formData.partner_name,
          partner_cpf: formData.partner_cpf,
          email_recipient: formData.email_recipient || formData.partner_name
        }
      };

      const { error } = await supabase
        .from('employees')
        .insert([employeeData]);

      if (error) throw error;

      toast({
        title: "Cadastro realizado com sucesso",
        description: "Seus dados foram enviados com sucesso.",
      });

      // Redirect to thank you page or specified redirect URL
      navigate(redirectUrl);
      
    } catch (error: any) {
      console.error("Erro ao enviar formulário:", error);
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
            <div className="space-y-2">
              <Label className="text-gray-700" htmlFor="company_name">Razão Social da Empresa</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange("company_name", e.target.value)}
                placeholder="Nome da empresa"
                required
                className="bg-gray-100"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700" htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange("cnpj", e.target.value)}
                  placeholder="00.000.000/0001-00"
                  required
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700" htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="empresa@exemplo.com"
                  required
                  className="bg-gray-100"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700" htmlFor="partner_name">Nome completo do sócio</Label>
                <Input
                  id="partner_name"
                  value={formData.partner_name}
                  onChange={(e) => handleInputChange("partner_name", e.target.value)}
                  placeholder="Nome do sócio"
                  required
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700" htmlFor="partner_cpf">CPF do sócio</Label>
                <Input
                  id="partner_cpf"
                  value={formData.partner_cpf}
                  onChange={(e) => handleInputChange("partner_cpf", e.target.value)}
                  placeholder="000.000.000-00"
                  required
                  className="bg-gray-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700" htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="(00) 00000-0000"
                required
                className="bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700" htmlFor="email_recipient">Nome do responsável</Label>
              <Input
                id="email_recipient"
                value={formData.email_recipient}
                onChange={(e) => handleInputChange("email_recipient", e.target.value)}
                placeholder="Se for diferente do sócio"
                className="bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700" htmlFor="address">Endereço completo com CEP</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Rua, número, complemento, bairro, cidade - UF, CEP"
                required
                className="bg-gray-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700" htmlFor="due_date">
                  Melhor data de vencimento do pagamento
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full bg-gray-100 justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      ) : (
                        <span>Escolha uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="p-3 pointer-events-auto"
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Qual a melhor maneira de pagamento?</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div 
                    className={cn(
                      "flex items-center justify-center rounded-md border px-3 py-2 cursor-pointer",
                      paymentType === "pix" ? "border-primary bg-primary/10" : "border-gray-300 bg-gray-100"
                    )}
                    onClick={() => setPaymentType("pix")}
                  >
                    <input
                      type="radio"
                      id="payment-pix"
                      name="payment_method"
                      value="pix"
                      checked={paymentType === "pix"}
                      onChange={() => setPaymentType("pix")}
                      className="sr-only"
                    />
                    <label htmlFor="payment-pix" className="text-sm cursor-pointer">PIX</label>
                  </div>
                  <div 
                    className={cn(
                      "flex items-center justify-center rounded-md border px-3 py-2 cursor-pointer",
                      paymentType === "boleto" ? "border-primary bg-primary/10" : "border-gray-300 bg-gray-100"
                    )}
                    onClick={() => setPaymentType("boleto")}
                  >
                    <input
                      type="radio"
                      id="payment-boleto"
                      name="payment_method"
                      value="boleto"
                      checked={paymentType === "boleto"}
                      onChange={() => setPaymentType("boleto")}
                      className="sr-only"
                    />
                    <label htmlFor="payment-boleto" className="text-sm cursor-pointer">Boleto</label>
                  </div>
                  <div 
                    className={cn(
                      "flex items-center justify-center rounded-md border px-3 py-2 cursor-pointer",
                      paymentType === "credit_card" ? "border-primary bg-primary/10" : "border-gray-300 bg-gray-100"
                    )}
                    onClick={() => setPaymentType("credit_card")}
                  >
                    <input
                      type="radio"
                      id="payment-credit-card"
                      name="payment_method"
                      value="credit_card"
                      checked={paymentType === "credit_card"}
                      onChange={() => setPaymentType("credit_card")}
                      className="sr-only"
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
