
import { EmployeeEmailSettings } from "./emails/EmployeeEmailSettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { TestEmployeeNotificationButton } from "./emails/TestEmployeeNotificationButton";
import { EmptyMonthlyValuesHelper } from "./employees/EmptyMonthlyValuesHelper";

export const EmployeeSettings = () => {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["employee-settings"],
    queryFn: async () => {
      // Fetch global settings
      const { data: globalSettings, error: globalError } = await supabase
        .from("global_settings")
        .select("employee_emails_send_day")
        .single();

      if (globalError) {
        console.error("Error fetching global settings:", globalError);
        throw globalError;
      }

      return {
        sendDay: globalSettings?.employee_emails_send_day || 5
      };
    }
  });

  return (
    <div className="space-y-10">
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Email</CardTitle>
          <CardDescription>
            Configure quando os emails serão enviados aos funcionários
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-[250px]" />
              <Skeleton className="h-10 w-[200px]" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-medium">Configurações Atuais:</h3>
                  <p className="text-sm text-muted-foreground">
                    Enviar no dia {settings?.sendDay} de cada mês
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <TestEmployeeNotificationButton />
                </div>
              </div>
              
              <EmployeeEmailSettings 
                open={false}
                onClose={() => {}}
                currentDay={settings?.sendDay}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico de Notificações</CardTitle>
          <CardDescription>
            Verifique quais funcionários podem receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyMonthlyValuesHelper />
        </CardContent>
      </Card>
    </div>
  );
};
