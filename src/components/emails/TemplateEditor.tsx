
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MailIcon, CalendarIcon, RefreshCwIcon } from "lucide-react";
import { EmailTemplate } from "@/types/email";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TemplatePreview } from "./TemplatePreview";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();
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

  // Dados de exemplo para preview
  const previewData = {
    nome_cliente: "João Silva",
    valor_cobranca: "R$ 1.500,00",
    data_vencimento: "15/04/2024",
    plano_servico: "Plano Premium",
    nome_funcionario: "Maria Santos",
    valor_nota: "R$ 3.000,00",
    mes_referencia: "Março/2024",
    total_horas: "160"
  };

  const handleTestEmail = async () => {
    if (!template.id) {
      toast({
        title: "Template não salvo",
        description: "Por favor, salve o template antes de enviar um email de teste.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          type: template.type,
          subtype: template.subtype,
          templateId: template.id,
          to: 'test@example.com', // You would typically get this from user input or configuration
          data: previewData,
        },
      });

      if (error) throw error;

      toast({
        title: "Email de teste enviado",
        description: "O email de teste foi enviado com sucesso!",
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email de teste. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

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
          {template.id && (
            <Button variant="secondary" onClick={handleTestEmail}>
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
          {showSendDay && (
            <div className="space-y-2">
              <Label htmlFor="send-day">Dia do Envio</Label>
              <Select
                value={String(template.send_day || 1)}
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

      {template.content && (
        <TemplatePreview 
          template={template as EmailTemplate} 
          previewData={previewData}
        />
      )}
    </div>
  );
};
