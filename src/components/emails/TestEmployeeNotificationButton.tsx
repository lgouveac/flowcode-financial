
import React, { useState } from "react";
import { LoadingButton } from "@/components/ui/loading-button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const TestEmployeeNotificationButton = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleTestNotification = async () => {
    try {
      setIsLoading(true);
      setResult(null);
      setError(null);
      
      // Call the function with proper parameters for testing
      const { data, error: functionError } = await supabase.functions.invoke("trigger-employee-notifications", {
        method: "POST",
        body: {
          test: true,
          bypass: true,
          forceDay: true,
          forceMonth: true,
          ignoreFilters: true,
          debug: true,
          execution_id: `manual-test-${new Date().toISOString()}`
        }
      });
      
      if (functionError) {
        console.error("Erro na função de notificação:", functionError);
        setError(functionError.message || "Erro desconhecido na função");
        throw functionError;
      }
      
      console.log("Resposta da notificação:", data);
      setResult(data);
      
      toast({
        title: "Ação concluída",
        description: "A função de notificação foi executada com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao executar função:", error);
      setError(error.message || "Erro desconhecido");
      toast({
        title: "Erro ao executar função",
        description: "Ocorreu um erro. Verifique o console para mais detalhes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <LoadingButton 
        variant="outline" 
        onClick={handleTestNotification} 
        loading={isLoading}
        className="min-w-[180px]"
      >
        Testar Notificação
      </LoadingButton>
      
      {result && (
        <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-400">Notificação enviada</AlertTitle>
          <div className="flex flex-col">
            <AlertDescription className="text-green-700 dark:text-green-300">
              {result.message || "A notificação foi processada com sucesso"}
            </AlertDescription>
            
            <div className="flex items-center mt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-green-700 dark:text-green-300 p-0"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Ocultar detalhes" : "Mostrar detalhes"}
                {showDetails ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
              </Button>
            </div>
            
            {showDetails && (
              <div className="mt-2 text-xs bg-white dark:bg-gray-950 p-2 rounded border border-green-200 dark:border-green-800 overflow-auto max-h-[200px]">
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao executar notificação</AlertTitle>
          <div className="flex flex-col">
            <AlertDescription>
              {error}
            </AlertDescription>
            
            <div className="flex items-center mt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-red-300 p-0"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Ocultar detalhes" : "Mostrar detalhes"}
                {showDetails ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
              </Button>
            </div>
            
            {showDetails && (
              <div className="mt-2 text-xs bg-white dark:bg-gray-950 p-2 rounded border border-red-200 dark:border-red-800 overflow-auto max-h-[200px]">
                <p>Verifique os logs da função no painel do Supabase para mais detalhes.</p>
              </div>
            )}
          </div>
        </Alert>
      )}
    </div>
  );
};
