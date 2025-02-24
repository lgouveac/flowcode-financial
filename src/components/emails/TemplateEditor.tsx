
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MailIcon, CalendarIcon, RefreshCwIcon } from "lucide-react";
import { EmailTemplate } from "@/types/email";
import { TemplatePreview } from "./TemplatePreview";
import { TemplateForm } from "./TemplateForm";
import { TestEmailDialog } from "./TestEmailDialog";
import { useTestEmail } from "@/hooks/useTestEmail";

interface TemplateEditorProps {
  type: 'clients' | 'employees';
  currentType: string;
  template: Partial<EmailTemplate>;
  onInputChange: (field: keyof EmailTemplate, value: string | number) => void;
  onSave: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  showSendDay?: boolean;
}

export const TemplateEditor = ({
  type,
  currentType,
  template,
  onInputChange,
  onSave,
  onDragOver,
  onDrop,
  showSendDay = false,
}: TemplateEditorProps) => {
  const isClient = type === 'clients';
  const isRecurring = currentType === 'recurring';

  const {
    testEmailOpen,
    setTestEmailOpen,
    testEmail,
    setTestEmail,
    selectedId,
    setSelectedId,
    testData,
    handleTestEmail,
    getTestData
  } = useTestEmail({ type, template });

  const getDescription = () => {
    if (!isClient) {
      return "Este template será usado para envio único de solicitação, disparado manualmente quando necessário";
    }
    return isRecurring
      ? "Template para cobranças mensais recorrentes. O sistema enviará automaticamente os e-mails todo mês, atualizando os valores e datas conforme o plano contratado."
      : "Template para cobranças pontuais/avulsas. O e-mail será enviado uma única vez quando solicitado, ideal para serviços específicos ou cobranças extras.";
  };

  const getIcon = () => {
    if (!isClient || (!isRecurring && isClient)) {
      return CalendarIcon;
    }
    return RefreshCwIcon;
  };

  const Icon = getIcon();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-2">
            <CardTitle>
              Editor de Template - {
                isClient 
                  ? (isRecurring ? "Cobrança Recorrente" : "Cobrança Pontual")
                  : (currentType === "invoice" ? "Nota Fiscal" : "Horas")
              }
            </CardTitle>
            <CardDescription className="flex items-start gap-2 mt-2 text-sm">
              <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
              {getDescription()}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <TemplateForm
            type={type}
            currentType={currentType}
            template={template}
            onInputChange={onInputChange}
            onSave={onSave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            showSendDay={showSendDay}
            onTestEmail={() => setTestEmailOpen(true)}
          />
        </CardContent>
      </Card>

      {template?.content && (
        <TemplatePreview 
          template={template as EmailTemplate} 
          previewData={getTestData(selectedId)}
        />
      )}

      <TestEmailDialog
        open={testEmailOpen}
        onOpenChange={setTestEmailOpen}
        testEmail={testEmail}
        onTestEmailChange={setTestEmail}
        selectedId={selectedId}
        onSelectedIdChange={setSelectedId}
        testData={testData}
        onSendTest={handleTestEmail}
        type={type}
      />
    </div>
  );
};
