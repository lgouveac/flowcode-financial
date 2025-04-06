
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClientTypeSelector } from "@/components/client/ClientTypeSelector";
import { PersonalForm } from "@/components/client/PersonalForm";
import { CompanyForm } from "@/components/client/CompanyForm";
import { CommonFields } from "@/components/client/CommonFields";
import { NewClient } from "@/types/client";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PublicClientForm() {
  const [clientType, setClientType] = useState<"pf" | "pj">("pj");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/thank-you";
  
  const [formData, setFormData] = useState<NewClient>({
    name: "",
    email: "",
    phone: "",
    type: "pj",
    company_name: "",
    cnpj: "",
    partner_name: "",
    partner_cpf: "",
    address: "",
    due_date: "",
    payment_method: "pix",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare the form data with the correct typing for Supabase
      const finalFormData = {
        ...formData,
        type: clientType,
        name: clientType === 'pj' ? formData.company_name : formData.name,
        status: 'active' as "active" | "inactive" | "overdue",
        total_billing: 0
      };

      // Create a public client without requiring authentication
      const { error } = await supabase
        .from('clients')
        .insert(finalFormData);

      if (error) throw error;

      toast({
        title: "Registro concluído",
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
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-full max-w-3xl mx-auto my-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Formulário de Cadastro</h1>
            <p className="text-muted-foreground mt-2">Por favor, preencha os dados abaixo para completar seu cadastro.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <ClientTypeSelector clientType={clientType} onTypeChange={setClientType} />
            
            {clientType === "pj" ? (
              <CompanyForm formData={formData} setFormData={setFormData} />
            ) : (
              <PersonalForm formData={formData} setFormData={setFormData} />
            )}
            
            <CommonFields 
              formData={formData} 
              setFormData={setFormData}
              clientType={clientType}
            />
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar Cadastro"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
