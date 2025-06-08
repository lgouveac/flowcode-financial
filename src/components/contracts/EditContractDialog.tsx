
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
    link_contrato: "",
    obs: "",
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
        link_contrato: contract.link_contrato || "",
        obs: contract.obs || "",
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
      await updateContract(contract.id, {
        scope: formData.scope,
        total_value: parseFloat(formData.total_value),
        installments: parseInt(formData.installments) || 1,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        status: formData.status,
        link_contrato: formData.link_contrato || undefined,
        obs: formData.obs || undefined,
      });
      
      onClose();
    } catch (error) {
      console.error("Error updating contract:", error);
    } finally {
      setLoading(false);
    }
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

          <div className="grid grid-cols-2 gap-4">
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
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
