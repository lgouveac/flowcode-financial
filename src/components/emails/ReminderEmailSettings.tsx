
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ReminderEmailSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testRecipientId, setTestRecipientId] = useState<string>("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  
  const { savedTemplates } = useEmailTemplates();
  const reminderTemplate = savedTemplates.find(
    template => template.type === 'clients' && template.subtype === 'reminder' && template.is_default
  );

  // Fetch reminder settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["payment-reminder-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_payment_reminder_settings');
      
      if (error) {
        console.error("Error fetching reminder settings:", error);
        throw new Error(error.message);
      }
      
      return {
        active: data.active ?? false,
        notificationTime: data.notification_time ?? "09:00",
        daysInterval: data.days_interval ?? 7
      };
    }
  });

  // Fetch clients with overdue payments
  const { data: overdueClients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["overdue-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          email,
          payments(id, due_date, amount)
        `)
        .eq('status', 'unpaid');
      
      if (error) {
        console.error("Error fetching overdue clients:", error);
        throw new Error(error.message);
      }
      
      // Filter clients to only those with overdue payments
      return data.filter(client => {
        const hasOverduePayments = client.payments.some((payment: any) => {
          const dueDate = new Date(payment.due_date);
          return dueDate < new Date() && payment.status !== 'paid';
        });
        return hasOverduePayments;
      });
    }
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (newSettings: {
      notificationTime: string;
      daysInterval: number;
      active: boolean;
    }) => {
      const { error } = await supabase.rpc('update_payment_reminder_settings', {
        p_notification_time: newSettings.notificationTime,
        p_days_interval: newSettings.daysInterval,
        p_active: newSettings.active
      });
      
      if (error) {
        console.error("Error updating reminder settings:", error);
        throw new Error(error.message);
      }
      
      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-reminder-settings"] });
      toast({
        title: "Configurações salvas",
        description: "As configurações de lembretes foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar configurações",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Send test email mutation
  const sendTestEmail = useMutation({
    mutationFn: async (clientId: string) => {
      setIsSendingTest(true);
      
      const { data, error } = await supabase.functions.invoke('send-reminder-email', {
        body: JSON.stringify({ clientId })
      });
      
      if (error) {
        console.error("Error sending test reminder:", error);
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: (data) => {
      setIsSendingTest(false);
      toast({
        title: "Email de teste enviado",
        description: "O email de lembrete de pagamento foi enviado com sucesso.",
      });
    },
    onError: (error) => {
      setIsSendingTest(false);
      toast({
        title: "Erro ao enviar email de teste",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Lembretes de Pagamento</CardTitle>
          <CardDescription>
            Configure quando os lembretes automáticos de pagamento em atraso serão enviados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Lembretes de Pagamento</CardTitle>
        <CardDescription>
          Configure quando os lembretes automáticos de pagamento em atraso serão enviados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch 
            id="reminder-active" 
            checked={settings?.active || false}
            onCheckedChange={(checked) => {
              updateSettings.mutate({
                ...settings!,
                active: checked
              });
            }}
          />
          <Label htmlFor="reminder-active">Ativar lembretes automáticos</Label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="notification-time">Horário de envio</Label>
            <Input 
              id="notification-time" 
              type="time"
              value={settings?.notificationTime || "09:00"}
              onChange={(e) => {
                updateSettings.mutate({
                  ...settings!,
                  notificationTime: e.target.value
                });
              }}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="days-interval">Intervalo de envio (dias)</Label>
            <Input 
              id="days-interval" 
              type="number"
              min="1"
              value={settings?.daysInterval || 7}
              onChange={(e) => {
                updateSettings.mutate({
                  ...settings!,
                  daysInterval: parseInt(e.target.value)
                });
              }}
            />
            <p className="text-sm text-muted-foreground">
              Quantos dias esperar entre o envio de lembretes para o mesmo cliente
            </p>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-2">Enviar um email de teste</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="test-recipient">Selecione um cliente com pagamento em atraso</Label>
              <Select 
                value={testRecipientId} 
                onValueChange={setTestRecipientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingClients ? (
                    <SelectItem value="loading" disabled>Carregando clientes...</SelectItem>
                  ) : overdueClients?.length === 0 ? (
                    <SelectItem value="none" disabled>Nenhum cliente com pagamento em atraso</SelectItem>
                  ) : (
                    overdueClients?.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => sendTestEmail.mutate(testRecipientId)}
              disabled={isSendingTest || !testRecipientId || !reminderTemplate}
              className="flex items-center gap-2"
            >
              {isSendingTest ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar teste
                </>
              )}
            </Button>
          </div>
          {!reminderTemplate && (
            <p className="text-sm text-destructive mt-2">
              Não há um template padrão para lembretes. Por favor, crie um template do tipo "Lembrete".
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
