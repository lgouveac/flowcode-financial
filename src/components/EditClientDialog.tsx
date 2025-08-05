
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Client } from "@/types/client";

interface EditClientDialogProps {
  client: Client | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditClientDialog = ({ client, open, onClose, onSuccess }: EditClientDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Client | null>(client);

  // Update formData when client changes
  if (client && (!formData || formData.id !== client.id)) {
    setFormData(client);
  }

  if (!formData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          type: formData.type,
          company_name: formData.company_name,
          cnpj: formData.cnpj,
          partner_name: formData.partner_name,
          partner_cpf: formData.partner_cpf,
          cpf: formData.cpf,
          address: formData.address,
          due_date: formData.due_date,
          payment_method: formData.payment_method,
          total_billing: formData.total_billing,
          responsible_name: formData.responsible_name,
          trade_name: formData.trade_name,
          legal_name: formData.legal_name
        })
        .eq('id', formData.id);

      if (error) throw error;

      toast({
        title: "Cliente atualizado",
        description: "As informações foram atualizadas com sucesso.",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao atualizar o cliente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{formData.type === "pj" ? "Nome Fantasia" : "Nome"}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required={formData.type === "pf"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive" | "overdue") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="overdue">Inadimplente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "pf" | "pj") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pf">Pessoa Física</SelectItem>
                  <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pagamento</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value: "pix" | "boleto" | "credit_card") =>
                  setFormData({ ...formData, payment_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible_name">Nome do Responsável</Label>
            <Input
              id="responsible_name"
              value={formData.responsible_name || ''}
              onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })}
              placeholder="Nome da pessoa responsável pelos pagamentos"
            />
          </div>

          {formData.type === "pj" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="legal_name">Razão Social</Label>
                <Input
                  id="legal_name"
                  value={formData.legal_name || formData.company_name || ''}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value, company_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj || ''}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partner_name">Nome do Sócio</Label>
                  <Input
                    id="partner_name"
                    value={formData.partner_name || ''}
                    onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner_cpf">CPF do Sócio</Label>
                  <Input
                    id="partner_cpf"
                    value={formData.partner_cpf || ''}
                    onChange={(e) => setFormData({ ...formData, partner_cpf: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {formData.type === "pf" && (
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf || ''}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_billing">Faturamento Total</Label>
              <Input
                id="total_billing"
                type="number"
                value={formData.total_billing}
                onChange={(e) => setFormData({ ...formData, total_billing: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Dia do Vencimento</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
