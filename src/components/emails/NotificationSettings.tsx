
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface NotificationInterval {
  id: string;
  days_before: number;
}

interface NotificationSettings {
  id: string;
  notification_time: string;
}

interface NotificationSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationSettings = ({ open, onClose }: NotificationSettingsDialogProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [intervals, setIntervals] = useState<NotificationInterval[]>([]);
  const [newInterval, setNewInterval] = useState<string>("");

  useEffect(() => {
    if (open) {
      fetchSettings();
      fetchIntervals();
    }
  }, [open]);

  const fetchSettings = async () => {
    try {
      let { data: existingSettings, error: countError } = await supabase
        .from('email_notification_settings')
        .select('*');

      if (countError) throw countError;

      // Se não houver configurações, cria uma nova
      if (!existingSettings || existingSettings.length === 0) {
        const { data: newSettings, error: insertError } = await supabase
          .from('email_notification_settings')
          .insert({ notification_time: '09:00' })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings);
      } else {
        // Usa a primeira configuração encontrada
        setSettings(existingSettings[0]);
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

  const fetchIntervals = async () => {
    try {
      const { data, error } = await supabase
        .from('email_notification_intervals')
        .select('*')
        .order('days_before', { ascending: false });

      if (error) throw error;
      setIntervals(data || []);
    } catch (error) {
      console.error('Error fetching notification intervals:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os intervalos de notificação.",
        variant: "destructive",
      });
    }
  };

  const handleTimeChange = async (time: string) => {
    if (!settings?.id) {
      toast({
        title: "Erro",
        description: "Configurações não encontradas.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('email_notification_settings')
        .update({ notification_time: time })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, notification_time: time } : null);
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

  const handleAddInterval = async () => {
    const days = parseInt(newInterval);
    if (isNaN(days) || days <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira um número válido de dias.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('email_notification_intervals')
        .insert({ days_before: days })
        .select()
        .single();

      if (error) throw error;

      setIntervals(prev => [...prev, data]);
      setNewInterval("");
      toast({
        title: "Sucesso",
        description: "Intervalo de notificação adicionado com sucesso.",
      });
    } catch (error) {
      console.error('Error adding notification interval:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o intervalo de notificação.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInterval = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_notification_intervals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIntervals(prev => prev.filter(interval => interval.id !== id));
      toast({
        title: "Sucesso",
        description: "Intervalo de notificação removido com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting notification interval:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o intervalo de notificação.",
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
              value={settings?.notification_time?.slice(0, 5) || ""}
              onChange={(e) => handleTimeChange(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <Label>Intervalos de Notificação</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                placeholder="Dias antes"
                value={newInterval}
                onChange={(e) => setNewInterval(e.target.value)}
              />
              <Button onClick={handleAddInterval} size="icon" className="text-white">
                <Plus className="h-4 w-4 text-white" />
              </Button>
            </div>

            <div className="space-y-2">
              {intervals.map((interval) => (
                <div key={interval.id} className="flex items-center justify-between p-2 border rounded">
                  <span>{interval.days_before} dias antes</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteInterval(interval.id)}
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </Button>
                </div>
              ))}
              {intervals.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  Nenhum intervalo configurado
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
