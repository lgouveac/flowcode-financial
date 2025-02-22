
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MailIcon, CalendarIcon, RefreshCwIcon } from "lucide-react";
import { EmailTemplate } from "@/types/email";

interface TemplateEditorProps {
  type: 'clients' | 'employees';
  currentType: string;
  template: Partial<EmailTemplate>;
  onInputChange: (field: keyof EmailTemplate, value: string) => void;
  onSave: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
}

export const TemplateEditor = ({
  type,
  currentType,
  template,
  onInputChange,
  onSave,
  onDragOver,
  onDrop,
}: TemplateEditorProps) => {
  const isClient = type === 'clients';
  const isRecurring = currentType === 'recurring';

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
        {isClient && (
          <Button variant="secondary" onClick={onSave}>
            <MailIcon className="mr-2 h-4 w-4" />
            Testar E-mail
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="template-name">Nome do Template</Label>
          <Input
            id="template-name"
            placeholder="Ex: Template padrão de NF"
            value={template.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, "template-name")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Assunto</Label>
          <Input
            id="subject"
            placeholder="Ex: Solicitação de Nota Fiscal - {mes_referencia}"
            value={template.subject}
            onChange={(e) => onInputChange('subject', e.target.value)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, "subject")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="content">Conteúdo</Label>
          <Textarea
            id="content"
            className="min-h-[300px]"
            placeholder={`Ex: Olá {nome_funcionario},\n\nPor favor, envie sua nota fiscal referente ao mês de {mes_referencia}...`}
            value={template.content}
            onChange={(e) => onInputChange('content', e.target.value)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, "content")}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={onSave}>Salvar Template</Button>
        </div>
      </CardContent>
    </Card>
  );
};
