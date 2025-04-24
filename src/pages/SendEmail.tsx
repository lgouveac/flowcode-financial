
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { EmailTemplate } from "@/types/email";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { NewTemplateDialog } from "@/components/emails/NewTemplateDialog";
import { ClientSelector } from "@/components/recurring-billing/ClientSelector";
import { EmailPreview } from "@/components/recurring-billing/EmailPreview";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function SendEmail() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [isNewTemplateDialogOpen, setIsNewTemplateDialogOpen] = useState(false);
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
    // This will be implemented later
    console.log("Sending email to:", selectedClient);
    console.log("Using template:", selectedTemplate);
  };

  const selectedTemplateData = savedTemplates.find(t => t.id === selectedTemplate);
  const selectedClientData = clients?.find(c => c.id === selectedClient);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enviar E-mail</h1>
          <p className="text-muted-foreground">
            Selecione um template e um cliente para enviar um e-mail.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configurações do E-mail</CardTitle>
            <CardDescription>
              Escolha o template e o destinatário do e-mail.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Template</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsNewTemplateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </div>
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
              Enviar E-mail
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prévia do E-mail</CardTitle>
            <CardDescription>
              Veja como o e-mail ficará antes de enviar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailPreview
              selectedTemplate={selectedTemplate}
              templates={savedTemplates}
              clientName={selectedClientData?.name}
              responsibleName={selectedClientData?.responsible_name}
            />
          </CardContent>
        </Card>
      </div>

      <NewTemplateDialog
        open={isNewTemplateDialogOpen}
        onClose={() => setIsNewTemplateDialogOpen(false)}
      />
    </div>
  );
}
