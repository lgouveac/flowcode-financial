
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PublicEmployeeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractType, setContractType] = useState<"pf" | "pj">("pj");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
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
    
    // PJ fields
    cnpj: "",
    company_name: "",
    partner_name: "",
    partner_cpf: "",
    
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
      if (!selectedDate) {
        throw new Error("Por favor, selecione uma data de vencimento.");
      }

      // Prepare employee data
      const employeeData = {
        name: contractType === "pj" ? formData.company_name : formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        payment_method: formData.payment_method,
        due_date: format(selectedDate, 'yyyy-MM-dd'),
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
    <div className="min-h-screen bg-gray-50 dark:bg-background flex justify-center">
      <div className="w-full max-w-3xl mx-auto my-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Formulário de Cadastro</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Por favor, preencha os dados abaixo para completar seu cadastro.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-base font-semibold text-gray-900 dark:text-white">Você contratará como pessoa física ou jurídica?</Label>
              <RadioGroup
                value={contractType}
                onValueChange={(value: "pf" | "pj") => setContractType(value)}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pj" id="contract-pj" />
                  <Label htmlFor="contract-pj" className="text-gray-900 dark:text-white">Pessoa Jurídica (PJ)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pf" id="contract-pf" />
                  <Label htmlFor="contract-pf" className="text-gray-900 dark:text-white">Pessoa Física (PF)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              {contractType === "pj" ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-gray-900 dark:text-white" htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={(e) => handleInputChange("cnpj", e.target.value)}
                        placeholder="00.000.000/0001-00"
                        required
                        className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-900 dark:text-white" htmlFor="company_name">Razão Social da Empresa</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => handleInputChange("company_name", e.target.value)}
                        required
                        placeholder="Nome da empresa"
                        className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-gray-900 dark:text-white" htmlFor="partner_name">Nome completo do sócio</Label>
                      <Input
                        id="partner_name"
                        value={formData.partner_name}
                        onChange={(e) => handleInputChange("partner_name", e.target.value)}
                        required
                        placeholder="Nome do sócio"
                        className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-900 dark:text-white" htmlFor="partner_cpf">CPF do sócio</Label>
                      <Input
                        id="partner_cpf"
                        value={formData.partner_cpf}
                        onChange={(e) => handleInputChange("partner_cpf", e.target.value)}
                        placeholder="000.000.000-00"
                        required
                        className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-gray-900 dark:text-white" htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                      placeholder="Seu nome completo"
                      className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-900 dark:text-white" htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange("cpf", e.target.value)}
                      placeholder="000.000.000-00"
                      required
                      className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white" htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    placeholder="email@exemplo.com"
                    className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white" htmlFor="phone">WhatsApp</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(00) 00000-0000"
                    required
                    className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-white" htmlFor="address">Endereço completo com CEP</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Rua, número, complemento, bairro, cidade - UF, CEP"
                  required
                  className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white" htmlFor="due_date">
                    {contractType === "pj" 
                      ? "Melhor data de vencimento do pagamento ou data da primeira parcela"
                      : "Melhor data de vencimento do pagamento"
                    }
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 justify-start text-left font-normal",
                          !selectedDate && "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          <span className="text-gray-900 dark:text-white">
                            {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
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
                  <Label className="text-gray-900 dark:text-white">Qual a melhor maneira de pagamento?</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value: "pix" | "boleto" | "credit_card") => 
                      handleInputChange("payment_method", value)
                    }
                  >
                    <SelectTrigger className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
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
                <Label className="text-gray-900 dark:text-white" htmlFor="email_recipient">Nome de quem vai receber o e-mail</Label>
                <Input
                  id="email_recipient"
                  value={formData.email_recipient}
                  onChange={(e) => handleInputChange("email_recipient", e.target.value)}
                  placeholder={contractType === "pj" ? "Se diferente do sócio" : "Se diferente do nome completo"}
                  className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full md:w-auto"
              >
                {isSubmitting ? "Enviando..." : "Enviar Cadastro"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
