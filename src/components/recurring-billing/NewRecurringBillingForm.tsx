import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RecurringBilling } from "@/types/billing";
import { variablesList } from "@/types/email";

interface NewRecurringBillingFormProps {
  onSubmit: (billing: RecurringBilling & { email_template?: string }) => void;
  onClose: () => void;
  clients: Array<{ id: string; name: string }>;
}

export const NewRecurringBillingForm = ({ onSubmit, onClose, clients }: NewRecurringBillingFormProps) => {
  const [formData, setFormData] = useState<Partial<RecurringBilling> & { email_template?: string }>({
    payment_method: 'pix',
    status: 'pending',
    installments: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id || !formData.description || !formData.amount || !formData.due_day || !formData.start_date || !formData.installments) {
      return;
    }
    onSubmit(formData as RecurringBilling & { email_template?: string });
    onClose();
  };

  const selectedClient = clients.find(client => client.id === formData.client_id);

  const previewEmail = () => {
    if (!formData.email_template) return null;

    const template = Object.entries(variablesList.clients.recurring)[0][1];
    let content = "Prezado {nome_cliente},\n\nSegue a cobrança no valor de R$ {valor_cobranca} referente ao serviço: {plano_servico}.\nVencimento todo dia {data_vencimento} do mês.\n\nParcela {numero_parcela} de {total_parcelas}.\n\nAtenciosamente.";

    // Replace variables with actual values
    content = content
      .replace("{nome_cliente}", selectedClient?.name || "Cliente")
      .replace("{valor_cobranca}", (formData.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
      .replace("{plano_servico}", formData.description || "")
      .replace("{data_vencimento}", String(formData.due_day || ""))
      .replace("{numero_parcela}", "1")
      .replace("{total_parcelas}", String(formData.installments || ""));

    return content;
  };

  const templateOptions = Object.entries(variablesList.clients.recurring)
    .filter(([key]) => key === 'recurring') // Filtra apenas templates recorrentes
    .map(([key, variables]) => ({
      key,
      label: "Template de Cobrança Recorrente"
    }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Cliente</Label>
        <Select onValueChange={(value) => setFormData({ ...formData, client_id: value })} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Template de Email</Label>
        <Select 
          onValueChange={(value) => setFormData({ ...formData, email_template: value })}
          defaultValue=""
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o template" />
          </SelectTrigger>
          <SelectContent>
            {templateOptions.map(({ key, label }) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Parcelas</Label>
          <Input
            type="number"
            min="1"
            value={formData.installments || ''}
            onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Dia do Vencimento</Label>
          <Input
            type="number"
            min="1"
            max="31"
            value={formData.due_day || ''}
            onChange={(e) => setFormData({ ...formData, due_day: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de Início</Label>
          <Input
            type="date"
            value={formData.start_date || ''}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Data Final (opcional)</Label>
          <Input
            type="date"
            value={formData.end_date || ''}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Método de Pagamento</Label>
        <Select 
          defaultValue="pix"
          onValueChange={(value: 'pix' | 'boleto' | 'credit_card') => 
            setFormData({ ...formData, payment_method: value })}
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

      {formData.email_template && (
        <div className="space-y-2">
          <Label>Prévia do Email</Label>
          <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-sm">
            {previewEmail()}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar
        </Button>
      </div>
    </form>
  );
};
