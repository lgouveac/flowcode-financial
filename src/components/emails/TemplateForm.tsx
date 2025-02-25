
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MailIcon } from "lucide-react";
import { EmailTemplate } from "@/types/email";

interface TemplateFormProps {
  type: 'clients' | 'employees';
  currentType: string;
  template: Partial<EmailTemplate>;
  onInputChange: (field: keyof EmailTemplate, value: string) => void;
  onSave: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onTestEmail: () => void;
}

export const TemplateForm = ({
  template,
  onInputChange,
  onSave,
  onDragOver,
  onDrop,
  onTestEmail,
}: TemplateFormProps) => {
  const hasRequiredFields = Boolean(
    template?.name && 
    template?.subject && 
    template?.content
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
        <Button onClick={onSave} disabled={!hasRequiredFields}>Salvar Template</Button>
        <Button 
          variant="secondary" 
          onClick={onTestEmail} 
          className="flex items-center gap-2"
          disabled={!hasRequiredFields}
        >
          <MailIcon className="h-4 w-4" />
          Testar E-mail
        </Button>
      </div>
    </div>
  );
};

