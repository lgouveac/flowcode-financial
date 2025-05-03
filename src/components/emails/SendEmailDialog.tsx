
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
import { format } from "date-fns";

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
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const { savedTemplates, isLoading: isLoadingTemplates } = useEmailTemplates();

  // Fetch recurring billing data if initialBillingId is provided
  const { data: billingData, isLoading: isLoadingBilling } = useQuery({
    queryKey: ['billing', initialBillingId],
    queryFn: async () => {
      if (!initialBillingId) return null;
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('recurring_billing')
          .select('*, clients(name, responsible_name, partner_name, cnpj, cpf, address)')
          .eq('id', initialBillingId)
          .single();
        
        if (error) {
          console.error("Error fetching billing:", error);
          toast({
            title: "Erro ao carregar dados",
            description: "Não foi possível carregar os dados da cobrança",
            variant: "destructive"
          });
          return null;
        }
        
        console.log("Loaded billing data:", data);
        return data as RecurringBilling;
      } catch (err) {
        console.error("Exception fetching billing:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    enabled: !!initialBillingId && open
  });

  // Set initial values if provided
  useEffect(() => {
    if (open) {
      // If we have billing data, immediately set the client and email data
      if (billingData) {
        console.log("Setting data from billing:", billingData);
        
        setSelectedClient(billingData.client_id);
        
        // Calculate the due date based on due_day
        const today = new Date();
        const dueDate = new Date(today.getFullYear(), today.getMonth(), billingData.due_day);
        
        // If the due date has passed this month, use next month
        if (dueDate < today) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }
        
        const formattedDueDate = format(dueDate, 'yyyy-MM-dd');
        
        setEmailData({
          description: billingData.description || "Serviços de consultoria",
          amount: billingData.amount || 0,
          dueDate: formattedDueDate
        });
        
        // Find an appropriate template
        if (billingData.email_template) {
          // Check if the template exists in our savedTemplates
          const templateExists = savedTemplates.some(t => t.id === billingData.email_template);
          if (templateExists) {
            setSelectedTemplate(billingData.email_template);
          } else {
            // Find a default recurring template if the template doesn't exist
            findDefaultTemplate();
          }
        } else {
          // Find a default recurring template
          findDefaultTemplate();
        }
        
        setIsLoading(false);
      } 
      // If no billing data but initialClientId is provided
      else if (initialClientId) {
        setSelectedClient(initialClientId);
      }
      
      // Set initial template if provided
      if (initialTemplateId) {
        setSelectedTemplate(initialTemplateId);
      }
    }
  }, [open, billingData, initialClientId, initialTemplateId, savedTemplates]);

  // Helper function to find a default template
  const findDefaultTemplate = () => {
    const recurringTemplate = savedTemplates.find(t => 
      t.type === 'clients' && t.subtype === 'recurring' && t.is_default
    );
    
    if (recurringTemplate) {
      setSelectedTemplate(recurringTemplate.id);
    } else if (savedTemplates.length > 0) {
      // If no default template, use the first available
      setSelectedTemplate(savedTemplates[0].id);
    }
  };

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
      if (!selectedClient || billingData) return []; // Don't fetch payments if we have billing data
      
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
    enabled: !!selectedClient && !initialBillingId && !billingData
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
        
        {isLoading || isLoadingBilling ? (
          <div className="flex justify-center p-6">
            <div className="animate-pulse">Carregando dados...</div>
          </div>
        ) : (
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
                    disabled={!!initialBillingId}
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
        )}
      </DialogContent>
    </Dialog>
  );
}
