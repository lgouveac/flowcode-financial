
import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LoadingButton } from "@/components/ui/loading-button";
import { supabase } from "@/integrations/supabase/client";

interface PaymentReminderSettings {
  id: string;
  notification_time: string;
  days_interval: number;
  active: boolean;
}

export const ReminderEmailSettings = () => {
  const { toast } = useToast();
  const [notificationTime, setNotificationTime] = useState("13:00");
  const [daysInterval, setDaysInterval] = useState(7);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientStatus, setClientStatus] = useState<"active" | "inactive" | "overdue">("overdue");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch settings directly from the table
      const { data, error } = await supabase
        .from('payment_reminder_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setNotificationTime(data.notification_time.slice(0, 5));
        setDaysInterval(data.days_interval);
        setActive(data.active);
      }
    } catch (error: any) {
      console.error("Error fetching reminder settings:", error);
      toast({
        title: "Erro ao carregar configurações",
        description: error.message || "Não foi possível carregar as configurações de lembretes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Update settings directly in the table
      const { data: existingSettings } = await supabase
        .from('payment_reminder_settings')
        .select('id')
        .single();

      if (existingSettings) {
        // Update existing
        const { error } = await supabase
          .from('payment_reminder_settings')
          .update({
            notification_time: notificationTime + ":00",
            days_interval: daysInterval,
            active: active,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('payment_reminder_settings')
          .insert({
            notification_time: notificationTime + ":00",
            days_interval: daysInterval,
            active: active
          });

        if (error) throw error;
      }
      
      toast({
        title: "Configurações salvas",
        description: "As configurações de lembretes foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      console.error("Error saving reminder settings:", error);
      toast({
        title: "Erro ao salvar configurações",
        description: error.message || "Não foi possível salvar as configurações de lembretes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const triggerManualNotification = async () => {
    try {
      setSaving(true);
      const { data, error } = await supabase.functions.invoke("trigger-reminder-emails", {});
      
      if (error) throw error;
      
      toast({
        title: "Lembretes enviados",
        description: "Os lembretes de pagamento foram enviados manualmente com sucesso.",
      });
      
      console.log("Reminder response:", data);
    } catch (error: any) {
      console.error("Error triggering reminders:", error);
      toast({
        title: "Erro ao enviar lembretes",
        description: error.message || "Não foi possível enviar os lembretes de pagamento.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="notification-active">Lembretes de pagamento</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="notification-active"
              checked={active}
              onCheckedChange={setActive}
              disabled={loading}
            />
            <Label htmlFor="notification-active" className="cursor-pointer">
              {active ? "Ativado" : "Desativado"}
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Enviar lembretes automáticos para clientes com pagamentos em atraso.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notification-time">Horário de envio</Label>
          <Input
            id="notification-time"
            type="time"
            value={notificationTime}
            onChange={(e) => setNotificationTime(e.target.value)}
            disabled={loading}
          />
          <p className="text-sm text-muted-foreground">
            Horário do dia em que os lembretes serão enviados.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="days-interval">Intervalo (dias)</Label>
          <Input
            id="days-interval"
            type="number"
            min="1"
            max="30"
            value={daysInterval}
            onChange={(e) => setDaysInterval(parseInt(e.target.value))}
            disabled={loading}
          />
          <p className="text-sm text-muted-foreground">
            Quantos dias devem passar entre os envios de lembretes.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-status">Status dos clientes</Label>
          <Select 
            value={clientStatus} 
            onValueChange={(value) => setClientStatus(value as "active" | "inactive" | "overdue")}
            disabled={loading}
          >
            <SelectTrigger id="client-status">
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overdue">Atrasados</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Quais clientes receberão os lembretes de pagamento.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <Button 
          variant="outline" 
          onClick={triggerManualNotification}
          disabled={saving}
        >
          Enviar lembretes manualmente
        </Button>
        <LoadingButton 
          onClick={saveSettings}
          loading={saving}
          disabled={loading}
        >
          Salvar configurações
        </LoadingButton>
      </div>
    </div>
  );
};
