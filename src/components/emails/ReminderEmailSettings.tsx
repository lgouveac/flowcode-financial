
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Clock, Calendar, RotateCcw } from "lucide-react";

interface ReminderSettings {
  id: number;
  notification_time: string;
  days_interval: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const ReminderEmailSettings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<ReminderSettings>({
    id: 1,
    notification_time: "09:00",
    days_interval: 7,
    active: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        // Using RPC call instead of direct table access since the table may not be in types yet
        const { data, error } = await supabase.rpc('get_payment_reminder_settings');

        if (error) throw error;
        
        if (data) {
          setSettings({
            id: data.id || 1,
            notification_time: data.notification_time?.substring(0, 5) || "09:00",
            days_interval: data.days_interval || 7,
            active: data.active ?? true
          });
        }
      } catch (error: any) {
        console.error("Error fetching reminder settings:", error);
        toast({
          title: "Erro ao carregar configurações",
          description: "Não foi possível carregar as configurações de lembretes. Usando valores padrão.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSaveSettings = async () => {
    try {
      // Using RPC call instead of direct table access
      const { error } = await supabase.rpc('update_payment_reminder_settings', {
        p_notification_time: settings.notification_time,
        p_days_interval: settings.days_interval,
        p_active: settings.active
      });

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As configurações de lembretes foram salvas com sucesso.",
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro ao salvar configurações",
        description: `Ocorreu um erro ao salvar: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Lembretes</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Lembretes de Pagamento</CardTitle>
        <CardDescription>Configure quando e como os lembretes serão enviados para clientes com pagamentos atrasados</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timing" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="timing">Agendamento</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="timing" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="notification-time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horário de Envio
                </Label>
                <Input
                  id="notification-time"
                  type="time"
                  value={settings.notification_time}
                  onChange={(e) => setSettings({...settings, notification_time: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="days-interval" className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Intervalo em Dias
                </Label>
                <Select 
                  value={String(settings.days_interval)} 
                  onValueChange={(value) => setSettings({...settings, days_interval: parseInt(value)})}
                >
                  <SelectTrigger id="days-interval">
                    <SelectValue placeholder="Selecione o intervalo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dia</SelectItem>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground mt-2">
              Com essas configurações, os lembretes serão enviados às <strong>{settings.notification_time}</strong> a cada <strong>{settings.days_interval} dias</strong> para clientes com pagamentos atrasados.
            </div>
          </TabsContent>
          
          <TabsContent value="status" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={settings.active}
                  onChange={(e) => setSettings({...settings, active: e.target.checked})}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="active">Ativar envio automático de lembretes</Label>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {settings.active 
                  ? "O sistema enviará lembretes automaticamente conforme configurado." 
                  : "O envio automático de lembretes está desativado."}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-6">
          <Button onClick={handleSaveSettings}>
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
