
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewPayment } from "@/types/payment";
import { variablesList } from "@/types/email";

interface NewPaymentFormProps {
  clients: Array<{ id: string; name: string }>;
  onSubmit: (payment: NewPayment & { email_template?: string }) => void;
  onClose: () => void;
}

export const NewPaymentForm = ({ clients, onSubmit, onClose }: NewPaymentFormProps) => {
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
    onSubmit(formData);
  };

  const selectedClient = clients.find(client => client.id === formData.client_id);
  
  const previewEmail = () => {
    if (!formData.email_template) return null;

    const template = Object.entries(variablesList.clients.oneTime)[0][1];
    let content = "Prezado {nome_cliente},\n\nSegue a cobrança no valor de R$ {valor_cobranca} referente a {descricao_servico}.\nVencimento: {data_vencimento}\n\nAtenciosamente.";

    // Replace variables with actual values
    content = content
      .replace("{nome_cliente}", selectedClient?.name || "Cliente")
      .replace("{valor_cobranca}", formData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
      .replace("{descricao_servico}", formData.description)
      .replace("{data_vencimento}", new Date(formData.due_date).toLocaleDateString('pt-BR'));

    return content;
  };

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
            onValueChange={(value) => setFormData({ ...formData, email_template: value })}
            defaultValue=""
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o template" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(variablesList.clients.oneTime).map(([key, variables]) => (
                <SelectItem key={key} value={key}>
                  Template de Cobrança Pontual
                </SelectItem>
              ))}
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

        {formData.email_template && (
          <div className="grid gap-2">
            <Label>Prévia do Email</Label>
            <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-sm">
              {previewEmail()}
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
