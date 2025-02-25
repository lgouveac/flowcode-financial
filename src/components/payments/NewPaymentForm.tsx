
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EmailTemplate } from "@/types/email";
import type { NewPayment } from "@/types/payment";

interface NewPaymentFormProps {
  clients: Array<{ id: string; name: string }>;
  onSubmit: (payment: NewPayment & { email_template?: string }) => void;
  onClose: () => void;
  templates?: EmailTemplate[];
}

export const NewPaymentForm = ({ clients, onSubmit, onClose, templates = [] }: NewPaymentFormProps) => {
  const [formData, setFormData] = useState<NewPayment & { email_template?: string }>({
    client_id: '',
    description: '',
    amount: 0,
    due_date: '',
    payment_method: 'pix',
    status: 'pending'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id || !formData.description || !formData.amount || !formData.due_date) {
      return;
    }
    onSubmit(formData);
  };

  const selectedClient = clients.find(client => client.id === formData.client_id);
  const filteredTemplates = templates.filter(template => 
    template.type === 'clients' && template.subtype === 'oneTime'
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="client">Cliente</Label>
          <Select
            value={formData.client_id}
            onValueChange={(value) => setFormData({ ...formData, client_id: value })}
          >
            <SelectTrigger id="client">
              <SelectValue placeholder="Selecione um cliente" />
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

        <div className="grid gap-2">
          <Label>Template de Email</Label>
          <Select 
            value={formData.email_template}
            onValueChange={(value) => setFormData({ ...formData, email_template: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o template" />
            </SelectTrigger>
            <SelectContent>
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  Nenhum template disponível
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="amount">Valor (R$)</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="due_date">Data de Vencimento</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="payment_method">Método de Pagamento</Label>
          <Select
            value={formData.payment_method}
            onValueChange={(value: 'pix' | 'boleto' | 'credit_card') =>
              setFormData({ ...formData, payment_method: value })
            }
          >
            <SelectTrigger id="payment_method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="boleto">Boleto</SelectItem>
              <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.email_template && selectedClient && (
          <div className="grid gap-2">
            <Label>Prévia do Email</Label>
            <div className="bg-background border rounded-md p-4 whitespace-pre-wrap text-sm">
              {/* Preview template content with replaced variables */}
              {templates.find(t => t.id === formData.email_template)?.content
                .replace('{nome_cliente}', selectedClient.name)
                .replace('{valor_cobranca}', formData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
                .replace('{data_vencimento}', new Date(formData.due_date).toLocaleDateString('pt-BR'))
                .replace('{descricao_servico}', formData.description)
                .replace('{forma_pagamento}', formData.payment_method === 'pix' ? 'PIX' : formData.payment_method === 'boleto' ? 'Boleto' : 'Cartão de Crédito')
              }
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
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
