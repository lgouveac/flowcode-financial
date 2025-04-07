
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const formType = searchParams.get("type") || "client"; // Default to client if not specified
  
  const getReturnUrl = () => {
    return formType === "employee" ? "/register-employee" : "/register-client";
  };
  
  const getTitle = () => {
    return formType === "employee" 
      ? "Cadastro de Colaborador Concluído" 
      : "Cadastro Concluído";
  };
  
  const getMessage = () => {
    return formType === "employee"
      ? "Seus dados como colaborador foram registrados com sucesso. Entraremos em contato em breve."
      : "Seus dados foram registrados com sucesso. Entraremos em contato em breve.";
  };

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center">
      <div className="w-full max-w-md p-8 bg-white shadow rounded-lg text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-3 text-gray-900">Obrigado!</h1>
        <p className="text-gray-600 mb-6">
          {getMessage()}
        </p>
        <Button asChild className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md font-medium">
          <a href={getReturnUrl()}>Voltar ao formulário</a>
        </Button>
      </div>
    </div>
  );
}
