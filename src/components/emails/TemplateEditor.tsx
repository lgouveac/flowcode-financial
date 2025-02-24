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
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";

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
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");

  const { data: testData } = useQuery({
    queryKey: ['test-data', type],
    queryFn: async () => {
      if (type === 'clients') {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, email')
          .order('name');
          
        if (error) {
          console.error('Error fetching clients:', error);
          throw error;
        }
        
        return data || [];
      } else {
        const { data, error } = await supabase
          .from('employees')
          .select('id, name, email')
          .order('name');
          
        if (error) {
          console.error('Error fetching employees:', error);
          throw error;
        }
        
        return data || [];
      }
    },
    enabled: testEmailOpen,
  });

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
  const getTestData = (id?: string) => {
    const baseData = {
      nome_cliente: "João Silva",
      valor_cobranca: "R$ 1.500,00",
      data_vencimento: "15/04/2024",
      plano_servico: "Plano Premium",
      nome_funcionario: "Maria Santos",
      valor_nota: "R$ 3.000,00",
      mes_referencia: "Março/2024",
      total_horas: "160"
    };

    if (!id || !testData) return baseData;

    const selected = testData.find(item => item.id === id);
    if (!selected) return baseData;

    if (isClient) {
      return {
        ...baseData,
        nome_cliente: selected.name,
      };
    } else {
      return {
        ...baseData,
        nome_funcionario: selected.name,
      };
    }
  };

  const handleTestEmail = async () => {
    try {
      if (!testEmail) {
        toast({
          title: "E-mail necessário",
          description: "Por favor, informe um e-mail para teste.",
          variant: "destructive",
        });
        return;
      }

      const previewData = getTestData(selectedId);
      const toastId = toast({
        title: "Enviando e-mail de teste...",
        description: "Aguarde um momento.",
      });

      console.log("Sending test email with data:", {
        type: template.type,
        subtype: template.subtype,
        templateId: template.id,
        to: testEmail,
        data: previewData
      });

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          type: template.type,
          subtype: template.subtype,
          templateId: template.id,
          to: testEmail,
          data: previewData,
        },
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }

      console.log('Email function response:', data);

      toast({
        id: toastId,
        title: "Email de teste enviado",
        description: "O email de teste foi enviado com sucesso!",
      });

      setTestEmailOpen(false);
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email de teste. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  const hasRequiredFields = Boolean(
    template?.name?.trim() && 
    template?.subject?.trim() && 
    template?.content?.trim()
  );

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
          {hasRequiredFields && (
            <Button variant="secondary" onClick={() => setTestEmailOpen(true)} className="flex items-center gap-2">
              <MailIcon className="h-4 w-4" />
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
          <div className="flex justify-end">
            <Button onClick={onSave}>Salvar Template</Button>
          </div>
        </CardContent>
      </Card>

      {template?.content && (
        <TemplatePreview 
          template={template as EmailTemplate} 
          previewData={getTestData(selectedId)}
        />
      )}

      <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar E-mail de Teste</DialogTitle>
            <DialogDescription>
              Durante o período de testes, o Resend só permite enviar e-mails para endereços verificados.
              Certifique-se de usar um e-mail que você tenha acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">E-mail para Teste</Label>
              <Input
                id="test-email"
                placeholder="seu.email@exemplo.com"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Selecionar {isClient ? "Cliente" : "Funcionário"} para Dados de Teste
              </Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Selecione um ${isClient ? "cliente" : "funcionário"}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Usar dados de exemplo</SelectItem>
                  {testData?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestEmailOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleTestEmail}>
              Enviar Teste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
