
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

  // Fetch the current settings when the dialog opens
  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('global_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching settings:', error);
        return;
      }

      if (data) {
        setSettingsId(data.id);
        setSendDay(data.employee_emails_send_day || currentDay);
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // First, save the day to global_settings
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

      // Check if notification settings exist
      const { data: existingSettings, error: checkError } = await supabase
        .from('email_notification_settings')
        .select('id')
        .limit(1);

      if (checkError) throw checkError;

      if (existingSettings && existingSettings.length > 0) {
        // Update existing notification settings
        const { error: updateError } = await supabase
          .from('email_notification_settings')
          .update({ notification_time: sendTime })
          .eq('id', existingSettings[0].id);

        if (updateError) throw updateError;
      } else {
        // Create new notification settings if none exist
        const { error: insertError } = await supabase
          .from('email_notification_settings')
          .insert({ notification_time: sendTime });

        if (insertError) throw insertError;
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
