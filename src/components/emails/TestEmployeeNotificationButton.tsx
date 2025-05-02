
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

      // First, let's check if we can find monthly values for the current month
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      console.log("Checking monthly values for month:", currentMonth);
      
      const {
        data: monthlyValues,
        error: monthlyError
      } = await supabase
        .from('employee_monthly_values')
        .select('*, employees!inner(*)')
        .eq('month', currentMonth);

      if (monthlyError) {
        console.error("Error fetching monthly values:", monthlyError);
        throw monthlyError;
      }

      console.log("Found employee monthly values:", monthlyValues);
      
      // Get available templates
      const { data: templates, error: templatesError } = await supabase
        .from('email_templates')
        .select('*')
        .in('subtype', ['invoice', 'hours'])
        .eq('type', 'employees');
        
      if (templatesError) {
        console.error("Error fetching templates:", templatesError);
      } else {
        console.log("Available templates:", templates);
      }

      // Call the edge function with test=true parameter and additional debugging
      const {
        data,
        error
      } = await supabase.functions.invoke("trigger-employee-notifications", {
        method: "POST",
        body: {
          test: true,
          forceDay: true, // Force the day check to pass
          forceMonth: true, // Force month check
          ignoreFilters: true, // Skip all filters
          debug: true // Enable extra debugging
        },
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (error) {
        console.error("Error response from notification function:", error);
        throw error;
      }
      
      console.log("Notification response:", data);
      
      if (data.totalSent > 0) {
        toast({
          title: "Notificações enviadas com sucesso",
          description: `${data.totalSent} email(s) enviado(s) para funcionários.`
        });
      } else if (data.totalErrors > 0) {
        toast({
          title: "Erro ao enviar notificações",
          description: `${data.totalErrors} erro(s) ocorreram durante o envio.`,
          variant: "destructive"
        });
      } else {
        // Make the message more specific about what was found
        const employeeInfo = monthlyValues && monthlyValues.length > 0 
          ? `Encontrados ${monthlyValues.length} funcionário(s) com valores para o mês atual, mas algo impediu o envio.` 
          : "Não há funcionários ativos com valores mensais para o mês atual.";
          
        toast({
          title: "Nenhuma notificação enviada",
          description: employeeInfo,
          variant: "default" // Changed from "warning" to "default" to fix the error
        });
      }
    } catch (error) {
      console.error("Error testing notifications:", error);
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
