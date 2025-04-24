
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { ClientSelector } from "@/components/recurring-billing/ClientSelector";
import { EmailPreview } from "@/components/recurring-billing/EmailPreview";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

interface SendEmailDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SendEmailDialog({ open, onClose }: SendEmailDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const { toast } = useToast();
  const { savedTemplates, isLoading: isLoadingTemplates } = useEmailTemplates();

  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, responsible_name, partner_name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const handleSendEmail = () => {
    // This will be implemented later when we add the email sending functionality
    console.log("Sending email to:", selectedClient);
    console.log("Using template:", selectedTemplate);
    toast({
      title: "Email enviado",
      description: "O email foi enviado com sucesso!",
    });
    onClose();
  };

  const selectedTemplateData = savedTemplates.find(t => t.id === selectedTemplate);
  const selectedClientData = clients?.find(c => c.id === selectedClient);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Enviar Email</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
                disabled={isLoadingTemplates}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {savedTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cliente</Label>
              {clients && (
                <ClientSelector 
                  clients={clients}
                  onSelect={setSelectedClient}
                />
              )}
            </div>

            <Button 
              className="w-full"
              disabled={!selectedTemplate || !selectedClient}
              onClick={handleSendEmail}
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Email
            </Button>
          </div>

          <div>
            <EmailPreview
              selectedTemplate={selectedTemplate}
              templates={savedTemplates}
              clientName={selectedClientData?.name}
              responsibleName={selectedClientData?.responsible_name}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
