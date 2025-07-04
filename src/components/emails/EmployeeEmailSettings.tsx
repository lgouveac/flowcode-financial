
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
  currentTime = "09:00" // Add default value for currentTime
}: EmployeeEmailSettingsProps) => {
  const { toast } = useToast();
  const [sendDay, setSendDay] = useState(currentDay);
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
      // Fetch global settings for the day
      const { data: globalData, error: globalError } = await supabase
        .from('global_settings')
        .select('id, employee_emails_send_day')
        .maybeSingle();

      if (globalError) {
        console.error('Error fetching global settings:', globalError);
        return;
      }

      if (globalData) {
        setSettingsId(globalData.id);
        setSendDay(globalData.employee_emails_send_day || currentDay);
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error);
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
          <DialogTitle>Configurações de Email para Funcionários</DialogTitle>
          <DialogDescription>
            Configure o dia em que os emails serão enviados automaticamente para os funcionários.
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
