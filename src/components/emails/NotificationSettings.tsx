
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface NotificationSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationSettings = ({ open, onClose }: NotificationSettingsDialogProps) => {
  const { toast } = useToast();
  const [timeValue, setTimeValue] = useState<string>("09:00");

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('employee_email_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (settings?.notification_time) {
        setTimeValue(settings.notification_time.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações de notificação.",
        variant: "destructive",
      });
    }
  };

  const handleTimeChange = async (time: string) => {
    setTimeValue(time);
    
    try {
      // First try to update existing settings
      const { data: existingSettings } = await supabase
        .from('employee_email_settings')
        .select('id')
        .single();

      if (existingSettings) {
        // Update existing
        const { error } = await supabase
          .from('employee_email_settings')
          .update({ notification_time: time })
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('employee_email_settings')
          .insert({ notification_time: time });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Horário de notificação atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Error updating notification time:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o horário de notificação.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurações de Notificação</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Horário de Envio</Label>
            <Input
              type="time"
              value={timeValue}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:brightness-100"
            />
          </div>

          <div className="space-y-4">
            <Label>Configurações de Email</Label>
            <p className="text-sm text-muted-foreground">
              As notificações são enviadas automaticamente no horário configurado acima.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
