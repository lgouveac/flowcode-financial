
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateSection } from "@/components/emails/TemplateSection";
import { NotificationSettings } from "@/components/emails/NotificationSettings";
import { Button } from "@/components/ui/button";
import { TestEmailDialog } from "@/components/emails/TestEmailDialog";
import { EmployeeEmailSettings } from "@/components/emails/EmployeeEmailSettings";
import { TestEmployeeNotificationButton } from "@/components/emails/TestEmployeeNotificationButton";
import { EmailCCRecipientsManager } from "@/components/emails/EmailCCRecipientsManager";
import { EmailTemplate } from "@/types/email";
import { createTemplate } from "@/services/templateService";

export default function Emails() {
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [employeeSettingsOpen, setEmployeeSettingsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);

  const handleSaveTemplate = async (template: Partial<EmailTemplate>): Promise<boolean> => {
    try {
      await createTemplate(template);
      return true;
    } catch (error) {
      console.error("Error saving template:", error);
      return false;
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Emails e Notificações</h1>
        <div className="space-x-3">
          <Button variant="outline" onClick={() => setTestEmailOpen(true)}>
            Testar Email
          </Button>
          <TestEmployeeNotificationButton />
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="templates">Templates de Email</TabsTrigger>
          <TabsTrigger value="settings">Configurações de Notificação</TabsTrigger>
          <TabsTrigger value="cc-recipients">Destinatários CC</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates">
          <TemplateSection type="clients" onSaveTemplate={handleSaveTemplate} />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <NotificationSettings open={notificationSettingsOpen} onClose={() => setNotificationSettingsOpen(false)} />
          <div className="flex justify-between items-center mt-8">
            <h2 className="text-xl font-semibold">Notificações para Funcionários</h2>
            <Button variant="outline" onClick={() => setEmployeeSettingsOpen(true)}>
              Configurar
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure o dia do mês e o horário em que os emails serão enviados automaticamente para os funcionários.
          </p>
        </TabsContent>
        
        <TabsContent value="cc-recipients">
          <EmailCCRecipientsManager />
        </TabsContent>
      </Tabs>

      {selectedTemplate ? (
        <TestEmailDialog 
          open={testEmailOpen} 
          onClose={() => setTestEmailOpen(false)} 
          template={{
            id: selectedTemplate,
            name: "",
            subject: "",
            content: "",
            type: "clients",
            subtype: "recurring",
            created_at: "",
            updated_at: ""
          }}
        />
      ) : null}
      
      <EmployeeEmailSettings 
        open={employeeSettingsOpen} 
        onClose={() => setEmployeeSettingsOpen(false)} 
      />
    </div>
  );
}
