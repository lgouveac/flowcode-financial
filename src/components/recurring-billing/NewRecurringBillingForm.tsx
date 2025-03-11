
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RecurringBilling } from "@/types/billing";
import type { EmailTemplate } from "@/types/email";
import { useRecurringBillingForm } from "@/hooks/useRecurringBillingForm";
import { ClientSelector } from "./ClientSelector";
import { BillingDetails } from "./BillingDetails";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { EmailPreview } from "./EmailPreview";

interface NewRecurringBillingFormProps {
  onSubmit: (billing: RecurringBilling & { email_template?: string }) => void;
  onClose: () => void;
  clients: Array<{ id: string; name: string, partner_name?: string }>;
  templates?: EmailTemplate[];
}

export const NewRecurringBillingForm = ({ 
  onSubmit, 
  onClose, 
  clients, 
  templates = [] 
}: NewRecurringBillingFormProps) => {
  const { formData, updateFormData, validateForm } = useRecurringBillingForm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting recurring billing form with data:", formData);
    if (!validateForm()) return;
    onSubmit(formData as RecurringBilling & { email_template?: string });
    onClose();
  };

  const selectedClient = clients.find(client => client.id === formData.client_id);
  const filteredTemplates = templates.filter(template => 
    template.type === 'clients' && template.subtype === 'recurring'
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ClientSelector 
        clients={clients}
        onSelect={(clientId) => updateFormData({ client_id: clientId })}
      />

      <div className="space-y-2">
        <Label>Template de Email</Label>
        <Select 
          onValueChange={(value) => updateFormData({ email_template: value })}
          value={formData.email_template}
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

      <BillingDetails
        description={formData.description || ''}
        amount={formData.amount || ''}
        installments={formData.installments || ''}
        dueDay={formData.due_day || ''}
        startDate={formData.start_date || ''}
        endDate={formData.end_date || ''}
        onUpdate={(field, value) => updateFormData({ [field]: value })}
      />

      <PaymentMethodSelector
        value={formData.payment_method}
        onChange={(value) => updateFormData({ payment_method: value })}
      />

      {formData.email_template && (
        <EmailPreview
          selectedTemplate={formData.email_template}
          templates={templates}
          clientName={selectedClient?.name}
          responsibleName={selectedClient?.partner_name}
          amount={formData.amount}
          dueDay={formData.due_day}
          description={formData.description}
          installments={formData.installments}
          paymentMethod={formData.payment_method}
        />
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
