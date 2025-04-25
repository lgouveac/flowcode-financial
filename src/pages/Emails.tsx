import { Send, FileText, RefreshCw, CalendarCheck, Plus } from "lucide-react";
import { useState } from "react";
import { TemplateSection } from "@/components/emails/TemplateSection";
import { Button } from "@/components/ui/button";
import { TestEmployeeNotificationButton } from "@/components/emails/TestEmployeeNotificationButton";
import { EmailCCRecipientsManager } from "@/components/emails/EmailCCRecipientsManager";
import { EmailTemplate } from "@/types/email";
import { createTemplate } from "@/services/templateService";
import { useToast } from "@/hooks/use-toast";
import { TestEmailDialog } from "@/components/emails/TestEmailDialog";
import { EmployeeEmailSettings } from "@/components/emails/EmployeeEmailSettings";
import { SendEmailDialog } from "@/components/emails/SendEmailDialog";
import { TemplateCategoryButton } from "@/components/emails/TemplateCategoryButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Emails() {
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [employeeSettingsOpen, setEmployeeSettingsOpen] = useState(false);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [showCCRecipients, setShowCCRecipients] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [currentTemplateType, setCurrentTemplateType] = useState<'clients' | 'employees'>('clients');
  const [currentSubtype, setCurrentSubtype] = useState<string>(
    currentTemplateType === 'clients' ? 'recurring' : 'invoice'
  );
  
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
    <div className="space-y-4 px-2 sm:px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Emails e Notificações
        </h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCCRecipients(true)}
          >
            Destinatários CC
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setSendEmailOpen(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar Email
          </Button>
          <TestEmployeeNotificationButton />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <Select value={currentTemplateType} onValueChange={(value: 'clients' | 'employees') => {
            setCurrentTemplateType(value);
            setCurrentSubtype(value === 'clients' ? 'recurring' : 'invoice');
          }}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecione o tipo de template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clients">Templates de Cliente</SelectItem>
              <SelectItem value="employees">Templates de Funcionário</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setSendEmailOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Tipo de Email
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {currentTemplateType === 'clients' ? (
            <>
              <TemplateCategoryButton
                icon={RefreshCw}
                label="Cobrança Recorrente"
                onClick={() => setCurrentSubtype('recurring')}
                active={currentSubtype === 'recurring'}
              />
              <TemplateCategoryButton
                icon={CalendarCheck}
                label="Cobrança Pontual"
                onClick={() => setCurrentSubtype('oneTime')}
                active={currentSubtype === 'oneTime'}
              />
              <TemplateCategoryButton
                icon={FileText}
                label="Contrato"
                onClick={() => setCurrentSubtype('contract')}
                active={currentSubtype === 'contract'}
              />
            </>
          ) : (
            <>
              <TemplateCategoryButton
                icon={FileText}
                label="Template NF"
                onClick={() => setCurrentSubtype('invoice')}
                active={currentSubtype === 'invoice'}
              />
              <TemplateCategoryButton
                icon={CalendarCheck}
                label="Template Horas"
                onClick={() => setCurrentSubtype('hours')}
                active={currentSubtype === 'hours'}
              />
            </>
          )}
        </div>

        <TemplateSection 
          type={currentTemplateType} 
          onSaveTemplate={handleSaveTemplate} 
        />
      </div>

      {selectedTemplate && (
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
      )}
      
      <EmployeeEmailSettings 
        open={employeeSettingsOpen} 
        onClose={() => setEmployeeSettingsOpen(false)} 
      />
      
      <SendEmailDialog
        open={sendEmailOpen}
        onClose={() => setSendEmailOpen(false)}
      />

      <EmailCCRecipientsManager 
        open={showCCRecipients}
        onClose={() => setShowCCRecipients(false)}
      />
    </div>
  );
}
