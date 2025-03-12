
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EmployeeEmailSettingsProps {
  open: boolean;
  onClose: () => void;
  currentDay?: number;
  currentTime?: string;
}

export const EmployeeEmailSettings = ({ 
  open, 
  onClose, 
  currentDay = 5, 
  currentTime = "09:00" 
}: EmployeeEmailSettingsProps) => {
  const { toast } = useToast();
  const [sendDay, setSendDay] = useState(currentDay);
  const [sendTime, setSendTime] = useState(currentTime);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [notificationSettingsId, setNotificationSettingsId] = useState<string | null>(null);

  // Fetch the current settings when the dialog opens
  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    try {
      // Fetch global settings (for the day)
      const { data: globalData, error: globalError } = await supabase
        .from('global_settings')
        .select('*')
        .single();

      if (globalError && globalError.code !== 'PGRST116') {
        console.error('Error fetching global settings:', globalError);
        toast({
          title: "Erro ao carregar configurações",
          description: "Não foi possível obter as configurações globais.",
          variant: "destructive",
        });
        return;
      }

      // Fetch notification settings (for the time)
      const { data: notificationData, error: notificationError } = await supabase
        .from('email_notification_settings')
        .select('*')
        .single();

      if (notificationError && notificationError.code !== 'PGRST116') {
        console.error('Error fetching notification settings:', notificationError);
        toast({
          title: "Erro ao carregar configurações",
          description: "Não foi possível obter as configurações de notificação.",
          variant: "destructive",
        });
        return;
      }

      // Update state with fetched data
      if (globalData) {
        setSettingsId(globalData.id);
        setSendDay(globalData.employee_emails_send_day || currentDay);
      }

      if (notificationData) {
        setNotificationSettingsId(notificationData.id);
        setSendTime(notificationData.notification_time ? notificationData.notification_time.substring(0, 5) : currentTime);
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Ocorreu um erro ao carregar as configurações.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save the day to global_settings
      if (!settingsId) {
        // If no settings exist, create a new record
        const { error } = await supabase
          .from('global_settings')
          .insert({ employee_emails_send_day: sendDay });

        if (error) throw error;
      } else {
        // Update existing settings
        const { error } = await supabase
          .from('global_settings')
          .update({ employee_emails_send_day: sendDay })
          .eq('id', settingsId);

        if (error) throw error;
      }

      // Save the time to email_notification_settings
      if (!notificationSettingsId) {
        // If no notification settings exist, create a new record
        const { error } = await supabase
          .from('email_notification_settings')
          .insert({ notification_time: sendTime });

        if (error) throw error;
      } else {
        // Update existing notification settings
        const { error } = await supabase
          .from('email_notification_settings')
          .update({ notification_time: sendTime })
          .eq('id', notificationSettingsId);

        if (error) throw error;
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações de email foram atualizadas com sucesso.",
      });

      onClose();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurações de Email</DialogTitle>
          <DialogDescription>
            Configure o dia e a hora em que os emails serão enviados automaticamente para os funcionários.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sendDay" className="text-right">
              Dia do mês
            </Label>
            <Input
              id="sendDay"
              type="number"
              min={1}
              max={31}
              value={sendDay}
              onChange={(e) => setSendDay(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sendTime" className="text-right">
              Horário
            </Label>
            <Input
              id="sendTime"
              type="time"
              value={sendTime}
              onChange={(e) => setSendTime(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
