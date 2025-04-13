
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateSection } from "@/components/emails/TemplateSection";
import { Button } from "@/components/ui/button";
import { TestEmailDialog } from "@/components/emails/TestEmailDialog";
import { EmployeeEmailSettings } from "@/components/emails/EmployeeEmailSettings";
import { TestEmployeeNotificationButton } from "@/components/emails/TestEmployeeNotificationButton";
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Emails e Notificações</h1>
        <div className="flex gap-2">
          <TestEmployeeNotificationButton />
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-[400px] mx-auto">
          <TabsTrigger value="templates">Templates de Email</TabsTrigger>
          <TabsTrigger value="cc-recipients">Destinatários CC</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates">
          <div className="mt-4">
            <Tabs defaultValue="clients" onValueChange={(value) => setCurrentTemplateType(value as 'clients' | 'employees')}>
              <TabsList className="grid grid-cols-2 w-full max-w-[400px] mx-auto">
                <TabsTrigger value="clients">Templates de Cliente</TabsTrigger>
                <TabsTrigger value="employees">Templates de Funcionário</TabsTrigger>
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
}
