
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";

export const EmployeeSettings = () => {
  const [sendDay, setSendDay] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('global_settings')
        .upsert({ employee_emails_send_day: parseInt(sendDay) });

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As configurações de envio de e-mail foram atualizadas com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ["global_settings"] });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de E-mail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Dia do mês para envio dos e-mails</Label>
          <div className="flex items-end gap-4">
            <div className="w-40">
              <Select value={sendDay} onValueChange={setSendDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      Dia {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Os e-mails para funcionários fixos e freelancers serão enviados neste dia do mês.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
