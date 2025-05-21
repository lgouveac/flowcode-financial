
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EmailTemplate } from "@/types/email";
import type { NewPayment } from "@/types/payment";
import { EmailPreview } from "../recurring-billing/EmailPreview";
import { supabase } from "@/integrations/supabase/client";
import { ClientSelector } from "../recurring-billing/ClientSelector";

interface NewPaymentFormProps {
  clients: Array<{ id: string; name: string; partner_name?: string; responsible_name?: string }>;
  onSubmit: (payment: NewPayment & { email_template?: string; responsible_name?: string }) => void;
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
  const [responsibleName, setResponsibleName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Ensure clients is always a valid array
  const safeClients = Array.isArray(clients) ? clients : [];

  // When client selection changes, update responsible name
  useEffect(() => {
    if (formData.client_id) {
      const client = safeClients.find(c => c.id === formData.client_id);
      if (client) {
        setResponsibleName(client.responsible_name || client.partner_name || "");
      } else {
        setResponsibleName("");
      }
    }
  }, [formData.client_id, safeClients]);

  const handleClientSelect = async (clientId: string) => {
    setFormData({ ...formData, client_id: clientId });
    
    setLoading(true);
    try {
      // Fetch most recent client data to get responsible_name
      const { data, error } = await supabase
        .from('clients')
        .select('name, responsible_name, partner_name')
        .eq('id', clientId)
        .single();
        
      if (error) {
        console.error('Error fetching client details:', error);
        return;
      }
      
      if (data) {
        setResponsibleName(data.responsible_name || data.partner_name || "");
      }
    } catch (err) {
      console.error('Error in handleClientSelect:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.client_id) {
      setValidationError("Por favor, selecione um cliente");
      return false;
    }
    
    if (!formData.description) {
      setValidationError("Por favor, adicione uma descrição");
      return false;
    }
    
    if (!formData.amount || formData.amount <= 0) {
      setValidationError("Por favor, adicione um valor válido");
      return false;
    }
    
    if (!formData.due_date) {
      setValidationError("Por favor, selecione uma data de vencimento");
      return false;
    }
    
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    
    try {
      // Format date if needed to ensure ISO format
      let formattedData = { ...formData };
      
      if (formData.due_date && typeof formData.due_date === 'string') {
        // Make sure the date is in ISO format YYYY-MM-DD
        if (!formData.due_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          try {
            const dateParts = formData.due_date.split('/');
            if (dateParts.length === 3) {
              const [day, month, year] = dateParts;
              formattedData.due_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          } catch (error) {
            console.error('Error formatting date:', error);
            setValidationError("Formato de data inválido");
            return;
          }
        }
      }
      
      // Send both formData and responsible_name
      onSubmit({
        ...formattedData,
        responsible_name: responsibleName
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      setValidationError("Ocorreu um erro ao processar o formulário");
    }
  };

  const selectedClient = safeClients.find(client => client.id === formData.client_id);
  const safeTemplates = Array.isArray(templates) ? templates : [];
  const filteredTemplates = safeTemplates.filter(template => 
    template.type === 'clients' && template.subtype === 'oneTime'
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      {validationError && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {validationError}
        </div>
      )}
      
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="client">Cliente</Label>
          <ClientSelector
            clients={safeClients}
            onSelect={handleClientSelect}
            initialValue={formData.client_id}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="responsible_name">Responsável</Label>
          <Input
            id="responsible_name"
            value={responsibleName}
            onChange={(e) => setResponsibleName(e.target.value)}
            placeholder="Nome do responsável"
            disabled={loading}
          />
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
          <EmailPreview
            selectedTemplate={formData.email_template}
            templates={safeTemplates}
            clientName={selectedClient.name}
            responsibleName={responsibleName || selectedClient.partner_name}
            amount={formData.amount}
            dueDate={formData.due_date}
            description={formData.description}
            paymentMethod={formData.payment_method}
          />
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
}
