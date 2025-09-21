
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientSelector } from "@/components/recurring-billing/ClientSelector";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useContracts } from "@/hooks/useContracts";
import { useWebhooks } from "@/hooks/useWebhooks";
import { useToast } from "@/hooks/use-toast";

interface NewContractDialogProps {
  open: boolean;
  onClose: () => void;
  onContractCreated?: (contract: any) => void;
}

export function NewContractDialog({ open, onClose, onContractCreated }: NewContractDialogProps) {
  const { addContract } = useContracts();
  const { getWebhook } = useWebhooks();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "",
    contract_id: "",
    scope: "",
    total_value: "",
    installments: "1",
    start_date: "",
    end_date: "",
    status: "active" as "active" | "completed" | "cancelled" | "suspended",
    contract_type: "closed_scope" as "open_scope" | "closed_scope",
    contractor_type: "individual" as "individual" | "legal_entity",
    data_de_assinatura: "",
    link_contrato: "",
    obs: "A FlowCode está muito feliz com nossa parceria.\n\nO projeto se inicia imediatamente após a assinatura do contrato e pagamento da primeira parcela no valor de R$ 2.000,00 no PIX: 48493939000161\n\nInfos importantes:\n\n- Nosso horário de atendimento é de 10-18 em dias úteis\n\n- Todos ajustes terão um prazo designado pela equipe\n\n- Nossa comunicação ocorre via grupo de whatsapp\n\n- Esse é um contrato de escopo fechado, cujo suporte acaba ao final da entrega. Para ter suporte ilimitado, confira nossos planos mensais.",
    info_parcelas_clientes: "",
    Horas: "",
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id || !formData.scope || !formData.total_value) {
      return;
    }

    setLoading(true);
    try {
      const totalValue = parseFloat(formData.total_value);
      const installments = parseInt(formData.installments);
      const installmentValue = totalValue / installments;

      // Buscar IP atual para assinatura automática FlowCode
      let flowcodeIP = '';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        flowcodeIP = ipData.ip;
      } catch (error) {
        console.warn('Não foi possível obter IP para assinatura FlowCode:', error);
        flowcodeIP = 'IP não disponível';
      }

      const contractData = {
        client_id: formData.client_id,
        contract_id: formData.contract_id || undefined,
        scope: formData.scope,
        total_value: totalValue,
        installments: installments,
        installment_value: installmentValue,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        status: formData.status,
        contract_type: formData.contract_type,
        contractor_type: formData.contractor_type,
        data_de_assinatura: formData.data_de_assinatura || undefined,
        link_contrato: formData.link_contrato || undefined,
        obs: formData.obs || undefined,
        info_parcelas_clientes: formData.info_parcelas_clientes || undefined,
        Horas: formData.contract_type === "open_scope" && formData.Horas ? formData.Horas : undefined,
        // Assinatura automática da FlowCode na criação
        data_assinatura_flowcode: new Date().toISOString(),
        ip_flowcode: flowcodeIP,
        assinante_flowcode: 'Lucas Gouvea Carmo',
      };

      // Disparar webhook configurado
      const webhookUrl = getWebhook('prestacao_servico', 'criacao');

      console.log('🔍 Debug webhook:', {
        webhookUrl,
        hasWebhook: !!webhookUrl,
        webhookTrimmed: webhookUrl?.trim(),
        isEmpty: webhookUrl?.trim() === ''
      });

      if (webhookUrl && webhookUrl.trim() !== '') {
        try {
          console.log('Disparando webhook de criação:', webhookUrl);

          // Preparar parâmetros para GET request
          const webhookParams = new URLSearchParams();

          // Campos básicos obrigatórios
          webhookParams.append('action', 'create_contract');
          webhookParams.append('timestamp', new Date().toISOString());

          // Todos os campos do contrato
          Object.entries(contractData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              webhookParams.append(key, value.toString());
            }
          });

          const webhookResponse = await fetch(`${webhookUrl}?${webhookParams}`, {
            method: "GET",
          });

          if (webhookResponse.ok) {
            toast({
              title: "Webhook enviado",
              description: "O webhook foi chamado com sucesso para o novo contrato.",
            });
          } else {
            throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
          }
        } catch (error) {
          console.error("Erro ao chamar webhook:", error);
          toast({
            title: "Aviso",
            description: "Contrato processado, mas houve problema ao chamar o webhook.",
            variant: "destructive",
          });
        }
      } else {
        console.log('Nenhum webhook configurado para criação de contrato');
      }

      // Callback opcional
      if (onContractCreated) {
        onContractCreated(contractData);
      }
      
      setFormData({
        client_id: "",
        contract_id: "",
        scope: "",
        total_value: "",
        installments: "1",
        start_date: "",
        end_date: "",
        status: "active",
        contract_type: "closed_scope",
        contractor_type: "individual",
        data_de_assinatura: "",
        link_contrato: "",
        obs: "A FlowCode está muito feliz com nossa parceria.\n\nO projeto se inicia imediatamente após a assinatura do contrato e pagamento da primeira parcela no valor de R$ 2.000,00 no PIX: 48493939000161\n\nInfos importantes:\n\n- Nosso horário de atendimento é de 10-18 em dias úteis\n\n- Todos ajustes terão um prazo designado pela equipe\n\n- Nossa comunicação ocorre via grupo de whatsapp\n\n- Esse é um contrato de escopo fechado, cujo suporte acaba ao final da entrega. Para ter suporte ilimitado, confira nossos planos mensais.",
        info_parcelas_clientes: "",
        Horas: "",
      });
      onClose();
    } catch (error) {
      console.error("Error adding contract:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calcula automaticamente o valor da parcela quando o valor total ou número de parcelas muda
  const calculateInstallmentValue = () => {
    const total = parseFloat(formData.total_value) || 0;
    const installments = parseInt(formData.installments) || 1;
    return total / installments;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Contrato</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <ClientSelector
                clients={clients}
                onSelect={(clientId) => setFormData({ ...formData, client_id: clientId })}
                initialValue={formData.client_id}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_id">ID do Contrato</Label>
              <Input
                id="contract_id"
                value={formData.contract_id}
                onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
                placeholder="Identificador único do contrato"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope">Escopo *</Label>
            <Textarea
              id="scope"
              required
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              placeholder="Descreva o escopo do contrato"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_value">Valor Total *</Label>
              <Input
                id="total_value"
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.total_value}
                onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installments">Número de Parcelas *</Label>
              <Input
                id="installments"
                type="number"
                min="1"
                required
                value={formData.installments}
                onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installment_value">Valor da Parcela</Label>
              <Input
                id="installment_value"
                type="number"
                step="0.01"
                value={calculateInstallmentValue().toFixed(2)}
                disabled
                className="bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract_type">Tipo de Contrato</Label>
              <Select value={formData.contract_type} onValueChange={(value) => setFormData({ ...formData, contract_type: value as "open_scope" | "closed_scope" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="closed_scope">Escopo Fechado</SelectItem>
                  <SelectItem value="open_scope">Escopo Aberto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractor_type">Tipo de Contratante</Label>
              <Select value={formData.contractor_type} onValueChange={(value) => setFormData({ ...formData, contractor_type: value as "individual" | "legal_entity" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Pessoa Física</SelectItem>
                  <SelectItem value="legal_entity">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.contract_type === "open_scope" && (
              <div className="space-y-2">
                <Label htmlFor="Horas">Horas</Label>
                <Input
                  id="Horas"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.Horas || ""}
                  onChange={(e) => setFormData({ ...formData, Horas: e.target.value })}
                  placeholder="Quantidade de horas"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_de_assinatura">Data de Assinatura</Label>
              <Input
                id="data_de_assinatura"
                type="date"
                value={formData.data_de_assinatura}
                onChange={(e) => setFormData({ ...formData, data_de_assinatura: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as "active" | "completed" | "cancelled" | "suspended" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link_contrato">Link do Contrato</Label>
            <Input
              id="link_contrato"
              type="url"
              value={formData.link_contrato}
              onChange={(e) => setFormData({ ...formData, link_contrato: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              value={formData.obs}
              onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
              placeholder="Observações adicionais"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="info_parcelas_clientes">Info de parcelas para os clientes</Label>
            <Textarea
              id="info_parcelas_clientes"
              value={formData.info_parcelas_clientes}
              onChange={(e) => setFormData({ ...formData, info_parcelas_clientes: e.target.value })}
              placeholder="Informações sobre as parcelas que serão exibidas para os clientes"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Contrato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
