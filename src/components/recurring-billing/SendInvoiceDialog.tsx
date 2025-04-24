
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RecurringBilling } from "@/types/billing";
import { EmailTemplate } from "@/types/email";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface SendInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  billing: RecurringBilling;
  templates?: EmailTemplate[];
}

export const SendInvoiceDialog = ({ 
  open, 
  onClose, 
  billing,
  templates = []
}: SendInvoiceDialogProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    // Find the template and pre-fill subject and message
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setMessage(template.content);
    }
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      toast({
        title: "Erro ao enviar",
        description: "Por favor, preencha o assunto do email.",
        variant: "destructive"
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Erro ao enviar",
        description: "Por favor, preencha o conteúdo do email.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSending(true);

      // This is a placeholder for actual email sending logic
      // In a real implementation, you would call an API endpoint to send the email
      console.log("Sending email:", {
        to: billing.clients?.name,
        subject,
        message,
        templateId: selectedTemplate
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Email enviado",
        description: "A cobrança foi enviada com sucesso."
      });

      onClose();
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar o email. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Enviar Cobrança por Email</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="template">Modelo de Email</Label>
            <Select value={selectedTemplate} onValueChange={handleSelectTemplate}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="recipient">Destinatário</Label>
            <Input 
              id="recipient" 
              value={billing.clients?.name || ""}
              disabled 
              className="bg-gray-100"
            />
          </div>

          <div>
            <Label htmlFor="subject">Assunto</Label>
            <Input 
              id="subject" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              placeholder="Digite o assunto do email"
            />
          </div>

          <div>
            <Label htmlFor="message">Mensagem</Label>
            <Textarea 
              id="message" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              placeholder="Digite a mensagem do email"
              className="min-h-[200px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
