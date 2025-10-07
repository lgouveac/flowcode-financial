import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link } from "lucide-react";
import { useWebhooks } from "@/hooks/useWebhooks";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface WebhookConfigModalProps {
  open: boolean;
  onClose: () => void;
  contractType: 'prestacao_servico' | 'nda' | 'profissionais' | 'documents';
  title: string;
}

export function WebhookConfigModal({ open, onClose, contractType, title }: WebhookConfigModalProps) {
  const { getWebhook, updateWebhook } = useWebhooks();
  const { toast } = useToast();
  
  const [webhookCriacao, setWebhookCriacao] = useState('');
  const [webhookAssinatura, setWebhookAssinatura] = useState('');
  const [webhookEdicao, setWebhookEdicao] = useState('');
  
  // Carregar webhooks quando modal abrir
  useEffect(() => {
    if (open) {
      const criacao = getWebhook(contractType, 'criacao') || '';
      const assinatura = getWebhook(contractType, 'assinatura') || '';
      const edicao = getWebhook(contractType, 'edicao') || '';
      setWebhookCriacao(criacao);
      setWebhookAssinatura(assinatura);
      setWebhookEdicao(edicao);
    }
  }, [open, contractType]);

  const handleSave = async () => {
    // Salvar no localStorage (comportamento original)
    updateWebhook(contractType, 'criacao', webhookCriacao);
    updateWebhook(contractType, 'assinatura', webhookAssinatura);
    updateWebhook(contractType, 'edicao', webhookEdicao);

    // Salvar no Supabase
    try {
      const { error } = await supabase
        .from('webhooks')
        .insert([{
          criacao_contrato: webhookCriacao || null,
          edicao_contrato: webhookEdicao || null,
          assinatura_contrato: webhookAssinatura || null
        }]);

      if (error) {
        console.error('Erro ao salvar webhooks:', error);
        throw error;
      }

      toast({
        title: "Webhooks Salvos",
        description: `Configuração de webhooks para ${title} salva com sucesso!`,
      });

    } catch (error) {
      console.error('Erro ao salvar webhooks:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração no banco de dados",
        variant: "destructive"
      });
    }

    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Configurar Webhooks - {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              Webhook de Criação
              <span className="text-xs text-muted-foreground ml-2">
                (chamado quando contrato é criado)
              </span>
            </Label>
            <input
              type="text"
              value={webhookCriacao}
              onChange={(e) => setWebhookCriacao(e.target.value)}
              placeholder="https://n8n.exemplo.com/webhook-criacao"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Webhook de Assinatura
              <span className="text-xs text-muted-foreground ml-2">
                (chamado quando contrato é assinado)
              </span>
            </Label>
            <input
              type="text"
              value={webhookAssinatura}
              onChange={(e) => setWebhookAssinatura(e.target.value)}
              placeholder="https://n8n.exemplo.com/webhook-assinatura"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Webhook de Edição
              <span className="text-xs text-muted-foreground ml-2">
                (chamado quando contrato é editado)
              </span>
            </Label>
            <input
              type="text"
              value={webhookEdicao}
              onChange={(e) => setWebhookEdicao(e.target.value)}
              placeholder="https://n8n.exemplo.com/webhook-edicao"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Configuração
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}