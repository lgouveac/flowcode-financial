
import { useState } from "react";
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
}

export const EmployeeEmailSettings = ({ open, onClose, currentDay = 5 }: EmployeeEmailSettingsProps) => {
  const { toast } = useToast();
  const [sendDay, setSendDay] = useState(currentDay);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('global_settings')
        .update({ employee_emails_send_day: sendDay })
        .eq('id', '1'); // Assumindo que temos apenas uma linha de configurações globais

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "O dia de envio dos emails foi atualizado com sucesso.",
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
            Configure o dia do mês em que os emails serão enviados automaticamente para os funcionários.
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
