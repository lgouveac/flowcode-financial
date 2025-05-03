import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { ClientSelector } from "@/components/recurring-billing/ClientSelector";
import { EmailPreview } from "@/components/recurring-billing/EmailPreview";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { RecurringBilling } from "@/types/billing";

interface SendEmailDialogProps {
  open: boolean;
  onClose: () => void;
  initialClientId?: string;
  initialTemplateId?: string;
  initialBillingId?: string;
}

export function SendEmailDialog({ 
  open, 
  onClose,
  initialClientId,
  initialTemplateId,
  initialBillingId
}: SendEmailDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [emailData, setEmailData] = useState({
    description: "Serviços de consultoria",
    amount: 1500,
    dueDate: new Date().toISOString().split('T')[0]
  });
  
  const { toast } = useToast();
  const { savedTemplates, isLoading: isLoadingTemplates } = useEmailTemplates();

  // Set initial values if provided
  useEffect(() => {
    if (initialClientId) {
      setSelectedClient(initialClientId);
    }
    if (initialTemplateId) {
      setSelectedTemplate(initialTemplateId);
    }
  }, [initialClientId, initialTemplateId]);

  // Fetch recurring billing data if initialBillingId is provided
  const { data: billingData } = useQuery({
    queryKey: ['billing', initialBillingId],
    queryFn: async () => {
      if (!initialBillingId) return null;
      
      const { data, error } = await supabase
        .from('recurring_billing')
        .select('*, clients(name, responsible_name, partner_name, cnpj, cpf, address)')
        .eq('id', initialBillingId)
        .single();
      
      if (error) {
        console.error("Error fetching billing:", error);
        return null;
      }
      
      // If we have billing data, update the client selection and email data
      if (data) {
        setSelectedClient(data.client_id);
        
        // Calculate the current month's due date based on due_day
        const today = new Date();
        const dueDate = new Date(today.getFullYear(), today.getMonth(), data.due_day);
        
        // If the due date has passed this month, use next month
        if (dueDate < today) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }
        
        setEmailData({
          description: data.description || "Serviços de consultoria",
          amount: data.amount || 0,
          dueDate: dueDate.toISOString().split('T')[0]
        });
        
        // If there's a template associated with this billing, select it
        if (data.email_template) {
          setSelectedTemplate(data.email_template);
        } else {
          // Otherwise find a default recurring template
          const recurringTemplate = savedTemplates.find(t => 
            t.type === 'clients' && t.subtype === 'recurring' && t.is_default
          );
          
          if (recurringTemplate) {
            setSelectedTemplate(recurringTemplate.id);
          }
        }
      }
      
      return data as RecurringBilling;
    },
    enabled: !!initialBillingId && !!savedTemplates.length
  });

  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, responsible_name, partner_name, cnpj, cpf, address')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Get client payments if a client is selected
  const { data: clientPayments } = useQuery({
    queryKey: ['client_payments', selectedClient],
    queryFn: async () => {
      if (!selectedClient) return [];
      
      const { data, error } = await supabase
        .from('payments')
        .select('id, description, amount, due_date')
        .eq('client_id', selectedClient)
        .order('due_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      // Only update email data if we don't have billing data already
      if (data && data.length > 0 && !initialBillingId) {
        const recentPayment = data[0];
        setEmailData({
          description: recentPayment.description || "Serviços de consultoria",
          amount: recentPayment.amount || 1500,
          dueDate: recentPayment.due_date || new Date().toISOString().split('T')[0]
        });
      }
      
      return data || [];
    },
    enabled: !!selectedClient && !initialBillingId
  });

  const handleSendEmail = () => {
    // This will be implemented later when we add the email sending functionality
    console.log("Sending email to:", selectedClient);
    console.log("Using template:", selectedTemplate);
    console.log("Email data:", emailData);
    
    toast({
      title: "Email enviado",
      description: "O email foi enviado com sucesso!",
    });
    onClose();
  };

  const handleEmailDataChange = (field: string, value: string | number) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectedTemplateData = savedTemplates.find(t => t.id === selectedTemplate);
  const selectedClientData = clients?.find(c => c.id === selectedClient);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Enviar Email</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
                disabled={isLoadingTemplates}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {savedTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cliente</Label>
              {clients && (
                <ClientSelector 
                  clients={clients}
                  onSelect={setSelectedClient}
                  initialValue={selectedClient}
                />
              )}
            </div>

            <div className="space-y-4 border p-3 rounded-md">
              <h3 className="font-medium">Dados do email</h3>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição do serviço</Label>
                <Input
                  id="description"
                  value={emailData.description}
                  onChange={(e) => handleEmailDataChange('description', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  value={emailData.amount}
                  onChange={(e) => handleEmailDataChange('amount', parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={emailData.dueDate}
                  onChange={(e) => handleEmailDataChange('dueDate', e.target.value)}
                />
              </div>
            </div>

            <Button 
              className="w-full"
              disabled={!selectedTemplate || !selectedClient}
              onClick={handleSendEmail}
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Email
            </Button>
          </div>

          <div>
            <EmailPreview
              selectedTemplate={selectedTemplate}
              templates={savedTemplates}
              clientName={selectedClientData?.name}
              responsibleName={selectedClientData?.responsible_name}
              amount={emailData.amount}
              dueDate={emailData.dueDate}
              description={emailData.description}
              client={selectedClientData}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
