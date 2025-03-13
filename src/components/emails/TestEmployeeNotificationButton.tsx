
import { useState } from "react";
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
      
      // Use URL params in the function name instead of the query object
      const { data, error } = await supabase.functions.invoke(
        "trigger-employee-notifications?test=true",
        {
          method: "GET",
          body: undefined, 
          headers: {
            "Content-Type": "application/json",
          }
        }
      );

      if (error) {
        throw error;
      }

      console.log("Notification response:", data);
      
      if (data.totalSent > 0) {
        toast({
          title: "Notificações enviadas com sucesso",
          description: `${data.totalSent} email(s) enviado(s) para funcionários.`,
        });
      } else if (data.totalErrors > 0) {
        toast({
          title: "Erro ao enviar notificações",
          description: `${data.totalErrors} erro(s) ocorreram durante o envio.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Nenhuma notificação enviada",
          description: "Não há funcionários com valores mensais para notificar.",
        });
      }
    } catch (error) {
      console.error("Error testing notifications:", error);
      toast({
        title: "Erro ao testar notificações",
        description: "Ocorreu um erro ao testar o envio de notificações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleTestNotification} 
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="w-auto"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Enviando...
        </>
      ) : (
        "Enviar Notificações"
      )}
    </Button>
  );
};
