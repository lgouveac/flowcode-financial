
import { PlusIcon, Upload } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateSection } from "@/components/emails/TemplateSection";
import { Button } from "@/components/ui/button";
import { TestEmployeeNotificationButton } from "@/components/emails/TestEmployeeNotificationButton";
import { ReminderEmailSettings } from "@/components/emails/ReminderEmailSettings";
import { EmailCCRecipientsManager } from "@/components/emails/EmailCCRecipientsManager";
import { EmailTemplate } from "@/types/email";
import { createTemplate } from "@/services/templateService";
import { useToast } from "@/hooks/use-toast";

export default function Emails() {
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [employeeSettingsOpen, setEmployeeSettingsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [currentTemplateType, setCurrentTemplateType] = useState<'clients' | 'employees'>('clients');
  const { toast } = useToast();

  const handleSaveTemplate = async (template: Partial<EmailTemplate>): Promise<boolean> => {
    try {
      console.log("Creating template with data:", template);
      await createTemplate(template);
      toast({
        title: "Template criado",
        description: "O template foi criado com sucesso!",
      });
      return true;
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast({
        title: "Erro ao criar template",
        description: `Não foi possível criar o template: ${error.message || "Erro desconhecido"}`,
        variant: "destructive",
      });
      return false;
    }
  };
  
  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Emails e Notificações</h1>
        <div className="flex gap-2">
          <TestEmployeeNotificationButton />
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-[600px] ml-0">
          <TabsTrigger value="templates">Templates de Email</TabsTrigger>
          <TabsTrigger value="reminders">Lembretes de Pagamento</TabsTrigger>
          <TabsTrigger value="cc-recipients">Destinatários CC</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="mt-4">
          <div>
            <Tabs defaultValue="clients" onValueChange={(value) => setCurrentTemplateType(value as 'clients' | 'employees')}>
              <TabsList className="grid grid-cols-2 w-full max-w-[400px] mx-auto mb-6">
                <TabsTrigger value="clients">
                  <span className="hidden sm:inline">Templates de Cliente</span>
                  <span className="sm:hidden">Cliente</span>
                </TabsTrigger>
                <TabsTrigger value="employees">
                  <span className="hidden sm:inline">Templates de Funcionário</span>
                  <span className="sm:hidden">Funcionário</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="clients" className="mt-4">
                <TemplateSection type="clients" onSaveTemplate={handleSaveTemplate} />
              </TabsContent>
              
              <TabsContent value="employees" className="mt-4">
                <TemplateSection type="employees" onSaveTemplate={handleSaveTemplate} />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
        
        <TabsContent value="reminders" className="mt-4">
          <ReminderEmailSettings />
        </TabsContent>
        
        <TabsContent value="cc-recipients">
          <EmailCCRecipientsManager />
        </TabsContent>
      </Tabs>

      {selectedTemplate ? <TestEmailDialog open={testEmailOpen} onClose={() => setTestEmailOpen(false)} template={{
        id: selectedTemplate,
        name: "",
        subject: "",
        content: "",
        type: "clients",
        subtype: "recurring",
        created_at: "",
        updated_at: ""
      }} /> : null}
      
      <EmployeeEmailSettings open={employeeSettingsOpen} onClose={() => setEmployeeSettingsOpen(false)} />
    </div>
  );
};

