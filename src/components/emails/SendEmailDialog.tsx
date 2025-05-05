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
import { format, parseISO } from "date-fns";

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
    dueDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const { toast } = useToast();
  const { savedTemplates, isLoading: isLoadingTemplates } = useEmailTemplates();

  // Fetch recurring billing data if initialBillingId is provided
  const { data: billingData, isLoading: isLoadingBilling, error: billingError } = useQuery({
    queryKey: ['billing', initialBillingId, open],
    queryFn: async () => {
      if (!initialBillingId || !open) return null;
      
      try {
        const { data, error } = await supabase
          .from('recurring_billing')
          .select('*, clients(name, responsible_name, partner_name, cnpj, cpf, address, email)')
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
      }
    },
    enabled: !!initialBillingId && open
  });

  // Helper function to find a default template
  const findDefaultTemplate = () => {
    if (!savedTemplates || savedTemplates.length === 0) return;
    
    // First try to find a default recurring template
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

  // Calculate due date from due_day
  const calculateDueDate = (dueDay: number) => {
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
    
    // If the due date has passed this month, use next month
    if (dueDate < today) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }
    
    return format(dueDate, 'yyyy-MM-dd');
  };

  // Set initial values when dialog opens or data changes
  useEffect(() => {
    if (!open) return; // Don't do anything if dialog is closed
    
    setIsLoading(true);
    
    // Reset loading after a small delay if it's still loading
    const timer = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 3000); // 3 second timeout as a safety measure
    
    try {
      // If we have billing data, immediately set the client and email data
      if (billingData) {
        console.log("Setting data from billing:", billingData);
        
        setSelectedClient(billingData.client_id);
        
        // Format due date properly from the due_day
        const formattedDueDate = calculateDueDate(billingData.due_day);
        
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
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
      
      // Set initial template if provided
      if (initialTemplateId) {
        setSelectedTemplate(initialTemplateId);
      }
    } catch (err) {
      console.error("Error setting initial values:", err);
      setIsLoading(false);
    }
    
    return () => clearTimeout(timer);
  }, [open, billingData, initialClientId, initialTemplateId, savedTemplates]);

  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      if (!open) return [];
      
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, responsible_name, partner_name, cnpj, cpf, address, email')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  // Get client payments if a client is selected
  const { data: clientPayments } = useQuery({
    queryKey: ['client_payments', selectedClient, open],
    queryFn: async () => {
      if (!selectedClient || !open || billingData) return []; // Don't fetch payments if we have billing data
      
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
          dueDate: recentPayment.due_date || format(new Date(), 'yyyy-MM-dd')
        });
      }
      
      return data || [];
    },
    enabled: !!selectedClient && !initialBillingId && !billingData && open
  });

  const handleSendEmail = async () => {
    if (!selectedTemplate || !selectedClient) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, selecione um template e um cliente.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSending(true);
      
      // Get client email
      const selectedClientData = clients?.find(c => c.id === selectedClient);
      
      if (!selectedClientData?.email) {
        toast({
          title: "Email não encontrado",
          description: "O cliente selecionado não possui um email cadastrado.",
          variant: "destructive"
        });
        setIsSending(false);
        return;
      }
      
      // Format the due date for display
      const dueDate = emailData.dueDate 
        ? format(new Date(emailData.dueDate), 'dd/MM/yyyy')
        : format(new Date(), 'dd/MM/yyyy');
      
      console.log("Sending email with data:", {
        to: selectedClientData.email,
        templateId: selectedTemplate,
        clientName: selectedClientData.name,
        responsibleName: selectedClientData.responsible_name || selectedClientData.partner_name || "",
        amount: emailData.amount,
        dueDate: dueDate,
        description: emailData.description
      });
      
      // Call the send-billing-email edge function
      const { error } = await supabase.functions.invoke(
        'send-billing-email',
        {
          body: JSON.stringify({
            to: selectedClientData.email,
            templateId: selectedTemplate,
            data: {
              recipientName: selectedClientData.name,
              responsibleName: selectedClientData.responsible_name || selectedClientData.partner_name || "",
              billingValue: emailData.amount,
              dueDate: dueDate,
              descricaoServico: emailData.description,
              
              // Add template variables in Portuguese format for backward compatibility
              nome_cliente: selectedClientData.name,
              nome_responsavel: selectedClientData.responsible_name || selectedClientData.partner_name || "",
              valor_cobranca: emailData.amount,
              data_vencimento: dueDate,
              descricao_servico: emailData.description
            }
          })
        }
      );
      
      if (error) {
        console.error("Error sending email:", error);
        throw error;
      }
      
      // Log email sent in notification log with correct fields
      const { error: logError } = await supabase
        .from('email_notification_log')
        .insert({
          client_id: selectedClient,
          billing_id: initialBillingId || null, // Use null if no billing ID
          days_before: 0,
          due_date: emailData.dueDate,
          payment_type: 'manual',
          sent_at: new Date().toISOString()
        });
        
      if (logError) {
        console.warn("Could not log email notification:", logError);
      }
      
      toast({
        title: "Email enviado",
        description: "O email foi enviado com sucesso para " + selectedClientData.email,
      });
      
      onClose();
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleEmailDataChange = (field: string, value: string | number) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectedTemplateData = savedTemplates.find(t => t.id === selectedTemplate);
  const selectedClientData = clients?.find(c => c.id === selectedClient);

  // Show error if billing fetch failed
  if (billingError) {
    console.error("Billing error:", billingError);
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Erro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-destructive">Não foi possível carregar os dados da cobrança. Por favor, tente novamente.</p>
            <Button onClick={onClose} className="w-full">Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
                disabled={!selectedTemplate || !selectedClient || isSending}
                onClick={handleSendEmail}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? "Enviando..." : "Enviar Email"}
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
                paymentMethod={billingData?.payment_method || 'pix'}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
