
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RecurringBilling } from "@/types/billing";
import { EmailTemplate } from "@/types/email";

interface NewRecurringBillingFormProps {
  onSubmit: (billing: RecurringBilling & { email_template?: string }) => void;
  onClose: () => void;
  clients: Array<{ id: string; name: string }>;
  templates?: EmailTemplate[];
}

export const NewRecurringBillingForm = ({ onSubmit, onClose, clients, templates = [] }: NewRecurringBillingFormProps) => {
  const [formData, setFormData] = useState<Partial<RecurringBilling> & { email_template?: string }>({
    payment_method: 'pix',
    status: 'pending',
    installments: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting recurring billing form with data:", formData);
    if (!formData.client_id || !formData.description || !formData.amount || !formData.due_day || !formData.start_date || !formData.installments) {
      console.error("Missing required fields:", {
        client_id: !formData.client_id,
        description: !formData.description,
        amount: !formData.amount,
        due_day: !formData.due_day,
        start_date: !formData.start_date,
        installments: !formData.installments
      });
      return;
    }
    onSubmit(formData as RecurringBilling & { email_template?: string });
    onClose();
  };

  const selectedClient = clients.find(client => client.id === formData.client_id);

  const previewEmail = () => {
    if (!formData.email_template) return null;

    const selectedTemplate = templates.find(t => t.id === formData.email_template);
    if (!selectedTemplate) return null;

    let content = selectedTemplate.content;

    const replacements = {
      "{nome_cliente}": selectedClient?.name || "Cliente",
      "{valor_cobranca}": (formData.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      "{data_vencimento}": String(formData.due_day || ""),
      "{plano_servico}": formData.description || "",
      "{numero_parcela}": "1",
      "{total_parcelas}": String(formData.installments || ""),
      "{forma_pagamento}": formData.payment_method === 'pix' ? 'PIX' : formData.payment_method === 'boleto' ? 'Boleto' : 'Cartão de Crédito'
    };

    Object.entries(replacements).forEach(([key, value]) => {
      content = content.replace(new RegExp(key, 'g'), value);
    });

    return content;
  };

  const filteredTemplates = templates.filter(template => template.type === 'clients' && template.subtype === 'recurring');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Cliente</Label>
        <Select 
          onValueChange={(value) => {
            console.log("Selected client:", value);
            setFormData({ ...formData, client_id: value });
          }} 
          required
        >
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

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input
          value={formData.description || ''}
          onChange={(e) => {
            console.log("Description changed:", e.target.value);
            setFormData({ ...formData, description: e.target.value });
          }}
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
            onChange={(e) => {
              console.log("Amount changed:", e.target.value);
              setFormData({ ...formData, amount: parseFloat(e.target.value) });
            }}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Parcelas</Label>
          <Input
            type="number"
            min="1"
            value={formData.installments || ''}
            onChange={(e) => {
              console.log("Installments changed:", e.target.value);
              setFormData({ ...formData, installments: parseInt(e.target.value) });
            }}
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
            onChange={(e) => {
              console.log("Due day changed:", e.target.value);
              setFormData({ ...formData, due_day: parseInt(e.target.value) });
            }}
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
            onChange={(e) => {
              console.log("Start date changed:", e.target.value);
              setFormData({ ...formData, start_date: e.target.value });
            }}
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
          onValueChange={(value: 'pix' | 'boleto' | 'credit_card') => {
            console.log("Payment method changed:", value);
            setFormData({ ...formData, payment_method: value });
          }}
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
          <div className="bg-background border rounded-md p-4 whitespace-pre-wrap text-sm">
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

