
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
      
      // Chamar a função edge com todas as opções ativadas para garantir o envio
      const {
        data,
        error
      } = await supabase.functions.invoke("trigger-employee-notifications", {
        method: "POST",
        body: {
          test: true,
          forceDay: true,       // Forçar verificação de dia
          forceMonth: true,     // Forçar verificação de mês
          ignoreFilters: true,  // Ignorar todos os filtros
          debug: true           // Habilitar depuração extra
        },
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (error) {
        console.error("Erro na resposta da função de notificação:", error);
        throw error;
      }
      
      console.log("Resposta da notificação:", data);
      
      if (data.totalSent > 0) {
        toast({
          title: "Notificações enviadas com sucesso",
          description: `${data.totalSent} email(s) enviado(s) para funcionários.`
        });
      } else {
        toast({
          title: "Nenhuma notificação enviada",
          description: data.message || "Nenhuma notificação foi enviada. Verifique os logs para mais detalhes.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao testar notificações:", error);
      toast({
        title: "Erro ao testar notificações",
        description: "Ocorreu um erro ao testar o envio de notificações. Verifique o console para mais detalhes.",
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
