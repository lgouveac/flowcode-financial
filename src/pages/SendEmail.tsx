
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Send } from "lucide-react";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { NewTemplateDialog } from "@/components/emails/NewTemplateDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SendEmailDialog } from "@/components/emails/SendEmailDialog";
import { useSearchParams } from "react-router-dom";

export default function SendEmail() {
  const [isNewTemplateDialogOpen, setIsNewTemplateDialogOpen] = useState(false);
  const [isSendEmailDialogOpen, setIsSendEmailDialogOpen] = useState(false);
  const { savedTemplates, isLoading: isLoadingTemplates } = useEmailTemplates();
  const searchParams = useSearchParams()[0];
  
  // Get billing ID from URL if present
  const billingId = searchParams.get("billingId");
  const clientId = searchParams.get("clientId");
  const templateId = searchParams.get("templateId");

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

  // Open send dialog automatically if billing ID is present
  useEffect(() => {
    if (billingId || clientId) {
      setIsSendEmailDialogOpen(true);
    }
  }, [billingId, clientId]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enviar E-mail</h1>
          <p className="text-muted-foreground">
            Envie emails para seus clientes usando templates personalizados.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsNewTemplateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
          <Button 
            onClick={() => setIsSendEmailDialogOpen(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar E-mail
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Cards com templates recentes */}
        {savedTemplates.slice(0, 6).map((template) => (
          <Card key={template.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.type === 'clients' ? 'Cliente' : 'Funcionário'}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{template.subject}</p>
              <Button 
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => {
                  setIsSendEmailDialogOpen(true);
                }}
              >
                <Send className="h-3.5 w-3.5 mr-2" />
                Usar Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <NewTemplateDialog
        open={isNewTemplateDialogOpen}
        onClose={() => setIsNewTemplateDialogOpen(false)}
      />

      <SendEmailDialog
        open={isSendEmailDialogOpen}
        onClose={() => setIsSendEmailDialogOpen(false)}
        initialBillingId={billingId || undefined}
        initialClientId={clientId || undefined}
        initialTemplateId={templateId || undefined}
      />
    </div>
  );
}
