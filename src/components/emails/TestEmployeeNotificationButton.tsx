
import React, { useState } from "react";
import { LoadingButton } from "@/components/ui/loading-button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const TestEmployeeNotificationButton = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleTestNotification = async () => {
    try {
      setIsLoading(true);
      
      // Call the function with proper parameters for testing
      const { data, error } = await supabase.functions.invoke("trigger-employee-notifications", {
        method: "POST",
        body: {
          test: true,
          bypass: true,
          forceDay: true,
          forceMonth: true,
          ignoreFilters: true,
          debug: true
        }
      });
      
      if (error) {
        console.error("Erro na função de notificação:", error);
        throw error;
      }
      
      console.log("Resposta da notificação:", data);
      
      toast({
        title: "Ação concluída",
        description: "A função de notificação foi executada com sucesso.",
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
    <LoadingButton 
      variant="outline" 
      onClick={handleTestNotification} 
      loading={isLoading}
    >
      Testar Notificação
    </LoadingButton>
  );
};
