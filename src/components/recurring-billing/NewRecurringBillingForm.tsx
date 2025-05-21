
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { RecurringBilling } from "@/types/billing";
import type { EmailTemplate } from "@/types/email";
import { useRecurringBillingForm } from "@/hooks/useRecurringBillingForm";
import { ClientSelector } from "./ClientSelector";
import { BillingDetails } from "./BillingDetails";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { EmailPreview } from "./EmailPreview";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  name: string;
  partner_name?: string;
  responsible_name?: string;
}

interface NewRecurringBillingFormProps {
  onSubmit: (billing: RecurringBilling & { email_template?: string; responsible_name?: string; disable_notifications?: boolean }) => void;
  onClose: () => void;
  clients: Client[];
  templates?: EmailTemplate[];
  isSubmitting?: boolean;
}

export const NewRecurringBillingForm = ({ 
  onSubmit, 
  onClose, 
  clients, 
  templates = [],
  isSubmitting = false
}: NewRecurringBillingFormProps) => {
  const { formData, updateFormData, validateForm } = useRecurringBillingForm();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [responsibleName, setResponsibleName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [disableNotifications, setDisableNotifications] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Ensure we always have valid clients array
  const safeClients = Array.isArray(clients) 
    ? clients.filter(client => 
        client && typeof client === 'object' && client.id && client.name
      ) 
    : [];

  // When client selection changes, try to get or update responsible name
  useEffect(() => {
    if (selectedClientId) {
      const client = safeClients.find(c => c.id === selectedClientId);
      if (client) {
        setResponsibleName(client.responsible_name || client.partner_name || "");
      } else {
        setResponsibleName("");
      }
    }
  }, [selectedClientId, safeClients]);

  const handleClientSelect = async (clientId: string) => {
    setSelectedClientId(clientId);
    updateFormData({ client_id: clientId });
    
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting recurring billing form with data:", formData);
    
    setValidationError(null);
    
    if (!validateForm()) {
      setValidationError("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    // Send both formData, responsible_name and disable_notifications flag
    onSubmit({
      ...(formData as RecurringBilling & { email_template?: string }),
      responsible_name: responsibleName,
      disable_notifications: disableNotifications
    });
  };

  // Ensure selectedClient is valid
  const selectedClient = safeClients.find(client => client && client.id === formData.client_id);
  
  // Ensure templates are valid
  const safeTemplates = Array.isArray(templates) 
    ? templates.filter(template => 
        template && typeof template === 'object' && template.id && template.type && template.subtype
      ) 
    : [];
    
  const filteredTemplates = safeTemplates.filter(template => 
    template.type === 'clients' && template.subtype === 'recurring'
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {validationError && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {validationError}
        </div>
      )}
      
      <ClientSelector 
        clients={safeClients || []}
        onSelect={handleClientSelect}
        loading={loading}
        disabled={isSubmitting}
      />
      
      <div className="space-y-2">
        <Label htmlFor="responsible_name">Responsável</Label>
        <Input
          id="responsible_name"
          value={responsibleName}
          onChange={(e) => setResponsibleName(e.target.value)}
          placeholder="Nome do responsável"
          disabled={loading || isSubmitting}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="disable_notifications"
          checked={disableNotifications}
          onCheckedChange={(checked) => setDisableNotifications(checked as boolean)}
          disabled={isSubmitting}
        />
        <Label htmlFor="disable_notifications">
          Desativar notificações automáticas
        </Label>
      </div>

      <div className="space-y-2">
        <Label>Template de Email</Label>
        <Select 
          onValueChange={(value) => updateFormData({ email_template: value })}
          value={formData.email_template}
          disabled={disableNotifications || isSubmitting}
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
        disabled={isSubmitting}
      />

      <PaymentMethodSelector
        value={formData.payment_method}
        onChange={(value) => updateFormData({ payment_method: value })}
        disabled={isSubmitting}
      />

      {formData.email_template && !disableNotifications && selectedClient && (
        <EmailPreview
          selectedTemplate={formData.email_template}
          templates={safeTemplates}
          clientName={selectedClient?.name || ""}
          responsibleName={responsibleName || selectedClient?.partner_name || ""}
          amount={formData.amount}
          dueDay={formData.due_day}
          description={formData.description}
          installments={formData.installments}
          paymentMethod={formData.payment_method}
        />
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
};
