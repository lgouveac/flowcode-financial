
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NotificationSettingsProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationSettings = ({ open, onClose }: NotificationSettingsProps) => {
  const [daysBeforeNotification, setDaysBeforeNotification] = useState<number>(7);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('email_notification_settings')
        .update({ notification_days_before: daysBeforeNotification })
        .eq('id', '1');

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As configurações de notificação foram atualizadas com sucesso.",
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial settings
  useState(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('email_notification_settings')
          .select('notification_days_before')
          .limit(1)
          .single();

        if (error) throw error;
        if (data) {
          setDaysBeforeNotification(data.notification_days_before);
        }
      } catch (error) {
        console.error('Error fetching notification settings:', error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurações de Notificação</DialogTitle>
          <DialogDescription>
            Configure quantos dias antes do vencimento as notificações serão enviadas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="daysBeforeNotification">Dias antes do vencimento</Label>
            <Input
              id="daysBeforeNotification"
              type="number"
              min="1"
              max="30"
              value={daysBeforeNotification}
              onChange={(e) => setDaysBeforeNotification(parseInt(e.target.value))}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
