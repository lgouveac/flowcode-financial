
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MailIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmailTemplate } from "@/types/email";

interface TemplateFormProps {
  type: 'clients' | 'employees';
  currentType: string;
  template: Partial<EmailTemplate>;
  onInputChange: (field: keyof EmailTemplate, value: string | number) => void;
  onSave: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  showSendDay?: boolean;
  onTestEmail: () => void;
}

export const TemplateForm = ({
  type,
  currentType,
  template,
  onInputChange,
  onSave,
  onDragOver,
  onDrop,
  showSendDay = false,
  onTestEmail,
}: TemplateFormProps) => {
  const hasRequiredFields = Boolean(
    template?.name?.trim() && 
    template?.subject?.trim() && 
    template?.content?.trim()
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="template-name">Nome do Template</Label>
        <Input
          id="template-name"
          placeholder="Ex: Template padrão de NF"
          value={template?.name || ''}
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
          value={template?.subject || ''}
          onChange={(e) => onInputChange('subject', e.target.value)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, "subject")}
        />
      </div>
      {showSendDay && (
        <div className="space-y-2">
          <Label htmlFor="send-day">Dia do Envio</Label>
          <Select
            value={String(template?.send_day || 1)}
            onValueChange={(value) => onInputChange('send_day', parseInt(value, 10))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o dia do envio" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={String(day)}>
                  Dia {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="content">Conteúdo</Label>
        <Textarea
          id="content"
          className="min-h-[300px]"
          placeholder={`Ex: Olá {nome_funcionario},\n\nPor favor, envie sua nota fiscal referente ao mês de {mes_referencia}...`}
          value={template?.content || ''}
          onChange={(e) => onInputChange('content', e.target.value)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, "content")}
        />
      </div>
      <div className="flex justify-end gap-2">
        {hasRequiredFields && (
          <Button variant="secondary" onClick={onTestEmail} className="flex items-center gap-2">
            <MailIcon className="h-4 w-4" />
            Testar E-mail
          </Button>
        )}
        <Button onClick={onSave}>Salvar Template</Button>
      </div>
    </div>
  );
};
