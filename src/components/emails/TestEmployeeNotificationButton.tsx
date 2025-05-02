
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const TestEmployeeNotificationButton = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleTestNotification = async () => {
    try {
      setIsLoading(true);
      
      // Chamar a função edge sem nenhum filtro ou validação
      const {
        data,
        error
      } = await supabase.functions.invoke("trigger-employee-notifications", {
        method: "POST",
        body: {
          test: true,
          bypass: true, // Bypass ALL checks
          forceDay: true,
          forceMonth: true, 
          ignoreFilters: true,
          debug: true
        },
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (error) {
        console.error("Erro na função de notificação:", error);
        throw error;
      }
      
      console.log("Resposta da notificação:", data);
      
      toast({
        title: "Ação concluída",
        description: data.message || "A função de notificação foi executada. Verifique os logs para mais detalhes.",
      });
    } catch (error) {
      console.error("Erro ao executar função:", error);
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
    <Button 
      variant="outline" 
      onClick={handleTestNotification} 
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      Testar Notificação
    </Button>
  );
};
