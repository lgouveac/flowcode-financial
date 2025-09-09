import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "lucide-react";
import { useWebhooks } from "@/hooks/useWebhooks";
import { useToast } from "@/hooks/use-toast";

interface WebhookConfigModalProps {
  open: boolean;
  onClose: () => void;
  contractType: 'prestacao_servico' | 'nda' | 'profissionais';
  title: string;
}

export function WebhookConfigModal({ open, onClose, contractType, title }: WebhookConfigModalProps) {
  const { getWebhook, updateWebhook } = useWebhooks();
  const { toast } = useToast();
  
  // Estados para webhooks
  const [webhookCriacao, setWebhookCriacao] = useState('');
  const [webhookAssinatura, setWebhookAssinatura] = useState('');
  
  // Atualizar estados quando o modal abrir ou contractType mudar
  useEffect(() => {
    if (open) {
      setWebhookCriacao(getWebhook(contractType, 'criacao'));
      setWebhookAssinatura(getWebhook(contractType, 'assinatura'));
    }
  }, [open, contractType]);

  const handleSave = () => {
    updateWebhook(contractType, 'criacao', webhookCriacao);
    updateWebhook(contractType, 'assinatura', webhookAssinatura);
    
    toast({
      title: "Webhooks Salvos",
      description: `Configuração de webhooks para ${title} atualizada com sucesso!`,
    });
    
    onClose();
  };

  const handleCancel = () => {
    // Restaurar valores originais
    setWebhookCriacao(getWebhook(contractType, 'criacao'));
    setWebhookAssinatura(getWebhook(contractType, 'assinatura'));
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
          {/* Webhook de Criação */}
          <div className="space-y-2">
            <Label htmlFor={`${contractType}-criacao`}>
              Webhook de Criação
              <span className="text-xs text-muted-foreground ml-2">
                (chamado quando contrato é criado)
              </span>
            </Label>
            <Input
              id={`${contractType}-criacao`}
              value={webhookCriacao}
              onChange={(e) => setWebhookCriacao(e.target.value)}
              placeholder="https://n8n.exemplo.com/webhook-criacao"
            />
          </div>

          {/* Webhook de Assinatura */}
          <div className="space-y-2">
            <Label htmlFor={`${contractType}-assinatura`}>
              Webhook de Assinatura
              <span className="text-xs text-muted-foreground ml-2">
                (chamado quando contrato é assinado)
              </span>
            </Label>
            <Input
              id={`${contractType}-assinatura`}
              value={webhookAssinatura}
              onChange={(e) => setWebhookAssinatura(e.target.value)}
              placeholder="https://n8n.exemplo.com/webhook-assinatura"
            />
          </div>

          {/* Botões */}
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