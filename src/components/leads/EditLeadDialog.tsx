import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeads } from "@/hooks/useLeads";
import { Lead, LEAD_STATUS_LABELS, LeadStatus } from "@/types/lead";

interface EditLeadDialogProps {
  lead: Lead;
  open: boolean;
  onClose: () => void;
}

export function EditLeadDialog({ lead, open, onClose }: EditLeadDialogProps) {
  const { updateLead, isUpdatingLead } = useLeads();
  const [formData, setFormData] = useState({
    Nome: "",
    Email: "",
    Celular: "",
    Valor: "",
    Status: "Income" as LeadStatus,
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        Nome: lead.Nome || "",
        Email: lead.Email || "",
        Celular: lead.Celular || "",
        Valor: lead.Valor?.toString() || "",
        Status: lead.Status || "Income",
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Nome) {
      return;
    }

    try {
      const updates = {
        Nome: formData.Nome,
        Email: formData.Email || undefined,
        Celular: formData.Celular || undefined,
        Valor: formData.Valor ? parseFloat(formData.Valor) : undefined,
        Status: formData.Status,
      };

      updateLead({ id: lead.id, updates });
      onClose();
    } catch (error) {
      console.error("Error updating lead:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="Nome">Nome *</Label>
              <Input
                id="Nome"
                required
                value={formData.Nome}
                onChange={(e) => setFormData({ ...formData, Nome: e.target.value })}
                placeholder="Nome do lead"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="Email">Email</Label>
              <Input
                id="Email"
                type="email"
                value={formData.Email}
                onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="Celular">Celular</Label>
              <Input
                id="Celular"
                value={formData.Celular}
                onChange={(e) => setFormData({ ...formData, Celular: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="Valor">Valor</Label>
              <Input
                id="Valor"
                type="number"
                step="0.01"
                value={formData.Valor}
                onChange={(e) => setFormData({ ...formData, Valor: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="Status">Status</Label>
              <Select
                value={formData.Status}
                onValueChange={(value) => setFormData({ ...formData, Status: value as LeadStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUpdatingLead}>
              {isUpdatingLead ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}