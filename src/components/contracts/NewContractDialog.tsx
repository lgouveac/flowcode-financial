
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

interface NewContractDialogProps {
  open: boolean;
  onClose: () => void;
  onContractCreated?: (contract: any) => void;
}

export function NewContractDialog({ open, onClose, onContractCreated }: NewContractDialogProps) {
  const { addContract } = useContracts();
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
    link_contrato: "",
    obs: "",
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
        link_contrato: formData.link_contrato || undefined,
        obs: formData.obs || undefined,
      };

      const createdContract = await addContract(contractData);
      
      // Chama o callback para executar o webhook
      if (onContractCreated && createdContract) {
        onContractCreated(createdContract);
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
        link_contrato: "",
        obs: "",
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
