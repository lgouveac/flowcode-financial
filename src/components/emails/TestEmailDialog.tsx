
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { EmailTemplate } from "@/types/email";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TestEmailDialogProps {
  template: EmailTemplate;
  open: boolean;
  onClose: () => void;
}

export const TestEmailDialog = ({ template, open, onClose }: TestEmailDialogProps) => {
  const { toast } = useToast();
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");

  // Fetch recipients based on template type
  const { data: recipients = [], isLoading } = useQuery({
    queryKey: ["recipients", template.type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(template.type === "employees" ? "employees" : "clients")
        .select("id, name, email")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });

  const handleTestEmail = async () => {
    if (!selectedRecipient) {
      toast({
        title: "Selecione um destinatário",
        description: "Por favor, selecione um destinatário para o email de teste.",
        variant: "destructive",
      });
      return;
    }

    try {
      const recipient = recipients.find(r => r.id === selectedRecipient);
      if (!recipient) throw new Error("Destinatário não encontrado");

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: recipient.email,
          subject: template.subject,
          content: template.content,
          recipientName: recipient.name,
        }
      });

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: "O email de teste foi enviado com sucesso.",
      });

      onClose();
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Não foi possível enviar o email de teste.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Email de Teste</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Selecione o destinatário</Label>
            <Select
              value={selectedRecipient}
              onValueChange={setSelectedRecipient}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  isLoading 
                    ? "Carregando..." 
                    : `Selecione ${template.type === "employees" ? "um funcionário" : "um cliente"}`
                } />
              </SelectTrigger>
              <SelectContent>
                {recipients.map((recipient) => (
                  <SelectItem key={recipient.id} value={recipient.id}>
                    {recipient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleTestEmail}>
              Enviar Teste
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
