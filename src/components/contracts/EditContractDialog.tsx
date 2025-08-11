
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContracts } from "@/hooks/useContracts";
import { Contract } from "@/types/contract";

interface EditContractDialogProps {
  contract: Contract;
  open: boolean;
  onClose: () => void;
}

export function EditContractDialog({ contract, open, onClose }: EditContractDialogProps) {
  const { updateContract } = useContracts();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    scope: "",
    total_value: "",
    installments: "",
    start_date: "",
    end_date: "",
    status: "active" as "active" | "completed" | "cancelled" | "suspended",
    contract_type: "closed_scope" as "open_scope" | "closed_scope",
    contractor_type: "individual" as "individual" | "legal_entity",
    data_de_assinatura: "",
    link_contrato: "",
    obs: "",
    Horas: "",
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        scope: contract.scope || "",
        total_value: contract.total_value?.toString() || "",
        installments: contract.installments?.toString() || "",
        start_date: contract.start_date || "",
        end_date: contract.end_date || "",
        status: contract.status || "active",
        contract_type: contract.contract_type || "closed_scope",
        contractor_type: contract.contractor_type || "individual",
        data_de_assinatura: contract.data_de_assinatura || "",
        link_contrato: contract.link_contrato || "",
        obs: contract.obs || "",
        Horas: contract.Horas || "",
      });
    }
  }, [contract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.scope || !formData.total_value) {
      return;
    }

    setLoading(true);
    try {
      const totalValue = parseFloat(formData.total_value);
      const installments = parseInt(formData.installments) || 1;
      const installmentValue = totalValue / installments;

      await updateContract(contract.id, {
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
        Horas: formData.contract_type === "open_scope" && formData.Horas ? formData.Horas : undefined,
      });
      
      onClose();
    } catch (error) {
      console.error("Error updating contract:", error);
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
          <DialogTitle>Editar Contrato</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="installments">Número de Parcelas</Label>
              <Input
                id="installments"
                type="number"
                min="1"
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
                </Content>
               </Select>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
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

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
