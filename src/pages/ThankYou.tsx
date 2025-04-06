
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function ThankYou() {
  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center">
      <div className="w-full max-w-md p-8 bg-white shadow rounded-lg text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-3 text-gray-900">Obrigado!</h1>
        <p className="text-gray-600 mb-6">
          Seus dados foram registrados com sucesso. 
          Entraremos em contato em breve.
        </p>
        <Button asChild className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md font-medium">
          <a href="/register-client">Voltar ao formulário</a>
        </Button>
      </div>
    </div>
  );
}
