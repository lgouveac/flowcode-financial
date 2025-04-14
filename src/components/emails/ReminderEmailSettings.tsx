
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailTemplate } from "@/types/email";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestEmailDialog } from "./TestEmailDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";

export function ReminderEmailSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [testEmailOpen, setTestEmailOpen] = useState(false);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('email_templates')
          .select('*')
          .eq('type', 'clients')
          .eq('subtype', 'reminder');

        if (error) throw error;
        
        if (data) {
          setTemplates(data as EmailTemplate[]);
          // Set the default template as selected, if any
          const defaultTemplate = data.find(t => t.is_default);
          if (defaultTemplate) {
            setSelectedTemplate(defaultTemplate as EmailTemplate);
          } else if (data.length > 0) {
            setSelectedTemplate(data[0] as EmailTemplate);
          }
        }
      } catch (error) {
        console.error('Error fetching reminder templates:', error);
        toast({
          title: "Erro ao carregar templates",
          description: "Não foi possível carregar os templates de lembrete",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, [toast]);

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
  };

  const handleSendTestEmail = () => {
    if (selectedTemplate) {
      setTestEmailOpen(true);
    }
  };

  const handleTriggerReminders = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('send-reminder-email', {
        body: { }
      });

      if (error) throw error;

      console.log('Reminder email response:', data);
      
      toast({
        title: "Lembretes enviados",
        description: "Os lembretes de pagamento foram enviados com sucesso!",
      });
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast({
        title: "Erro ao enviar lembretes",
        description: "Não foi possível enviar os lembretes de pagamento",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lembretes de Pagamento</CardTitle>
          <CardDescription>
            Configure os lembretes automáticos para clientes com pagamentos em atraso
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-1/2 mt-4" />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-4 text-center space-y-4 border border-dashed rounded-md">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="font-medium">Nenhum template de lembrete encontrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Crie um template do tipo "Lembrete de Pagamento" na aba Templates de Email
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Templates disponíveis:</p>
                {templates.length > 0 && (
                  <Tabs defaultValue={selectedTemplate?.id || templates[0].id}>
                    <TabsList className="w-full">
                      {templates.map(template => (
                        <TabsTrigger 
                          key={template.id} 
                          value={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className="flex-1"
                        >
                          {template.name}
                          {template.is_default && <span className="ml-2 text-xs bg-green-100 text-green-800 px-1 rounded">Padrão</span>}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                )}
              </div>
              
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={handleSendTestEmail}
                  disabled={!selectedTemplate}
                >
                  Testar Email
                </Button>
                <Button onClick={handleTriggerReminders}>
                  Enviar Lembretes de Pagamento
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTemplate && (
        <TestEmailDialog
          template={selectedTemplate}
          open={testEmailOpen}
          onClose={() => setTestEmailOpen(false)}
        />
      )}
    </div>
  );
}
