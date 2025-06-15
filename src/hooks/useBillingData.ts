
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { RecurringBilling } from "@/types/billing";
import type { Payment } from "@/types/payment";
import type { EmailTemplate } from "@/types/email";

export const useBillingData = () => {
  const [billings, setBillings] = useState<RecurringBilling[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchBillingWithClients = async (billingData: any[]) => {
    if (!billingData || billingData.length === 0) return [];
    
    const clientIds = [...new Set(billingData.map(item => item.client_id))].filter(Boolean);
    
    if (clientIds.length === 0) return billingData;
    
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .in('id', clientIds);
      
    if (clientsError) {
      console.error('Error fetching clients for billings:', clientsError);
      return billingData;
    }
    
    const clientsMap = (clientsData || []).reduce((acc, client) => {
      if (client && client.id) {
        acc[client.id] = client;
      }
      return acc;
    }, {} as Record<string, any>);
    
    return billingData.map(billing => ({
      ...billing,
      clients: billing.client_id && clientsMap[billing.client_id] ? clientsMap[billing.client_id] : null
    }));
  };

  const fetchBillings = useCallback(async () => {
    console.log("Fetching billings...");
    
    try {
      const { data, error } = await supabase
        .from('recurring_billing')
        .select('*');

      if (error) {
        console.error('Error fetching billings:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os recebimentos recorrentes.",
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        const billingsWithClients = await fetchBillingWithClients(data);
        console.log("Billings fetched:", billingsWithClients);
        setBillings(billingsWithClients || []);
      } else {
        setBillings([]);
      }
    } catch (err) {
      console.error("Error in fetchBillings:", err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar os recebimentos recorrentes.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchPaymentsWithClients = async (paymentData: any[]) => {
    if (!paymentData || paymentData.length === 0) return [];
    
    const clientIds = [...new Set(paymentData.map(item => item.client_id))].filter(Boolean);
    
    if (clientIds.length === 0) return paymentData;
    
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .in('id', clientIds);
      
    if (clientsError) {
      console.error('Error fetching clients for payments:', clientsError);
      return paymentData;
    }
    
    const clientsMap = (clientsData || []).reduce((acc, client) => {
      if (client && client.id) {
        acc[client.id] = client;
      }
      return acc;
    }, {} as Record<string, any>);
    
    return paymentData.map(payment => ({
      ...payment,
      clients: payment.client_id && clientsMap[payment.client_id] ? clientsMap[payment.client_id] : null
    }));
  };

  const fetchPayments = useCallback(async () => {
    console.log("Fetching payments...");
    
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os recebimentos pontuais.",
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        const paymentsWithClients = await fetchPaymentsWithClients(data);
        console.log("Payments fetched:", paymentsWithClients);
        setPayments(paymentsWithClients || []);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error("Error in fetchPayments:", err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar os recebimentos pontuais.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name');

      if (error) {
        console.error('Error fetching clients:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os clientes.",
          variant: "destructive",
        });
        return;
      }

      const validClients = Array.isArray(data) 
        ? data.filter(client => 
            client && 
            typeof client === 'object' && 
            client.id && 
            typeof client.name === 'string'
          )
        : [];
      
      console.log("Clients fetched:", validClients);
      setClients(validClients);
    } catch (err) {
      console.error("Error in fetchClients:", err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar os clientes.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const validateTemplateType = (type: string): type is 'clients' | 'employees' => {
    return type === 'clients' || type === 'employees';
  };

  const validateTemplateSubtype = (subtype: string): subtype is 'recurring' | 'oneTime' | 'invoice' | 'hours' => {
    return ['recurring', 'oneTime', 'invoice', 'hours'].includes(subtype);
  };

  const fetchTemplates = useCallback(async () => {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*');

    if (error) {
      console.error('Error fetching templates:', error);
      return;
    }

    const validTemplates = (data || []).reduce<EmailTemplate[]>((acc, template) => {
      if (!template.id || !template.name || !template.subject || !template.content || 
          !template.type || !template.subtype || !template.created_at || !template.updated_at) {
        console.warn('Template missing required fields:', template);
        return acc;
      }

      if (!validateTemplateType(template.type)) {
        console.warn(`Invalid template type found: ${template.type}`);
        return acc;
      }

      if (!validateTemplateSubtype(template.subtype)) {
        console.warn(`Invalid template subtype found: ${template.subtype}`);
        return acc;
      }

      acc.push({
        id: template.id,
        name: template.name,
        subject: template.subject,
        content: template.content,
        type: template.type,
        subtype: template.subtype,
        created_at: template.created_at,
        updated_at: template.updated_at
      });

      return acc;
    }, []);

    console.log("Templates fetched and validated:", validTemplates);
    setTemplates(validTemplates);
  }, []);

  // Debounced refresh function to prevent multiple rapid calls
  const debouncedRefresh = useCallback(() => {
    const timeout = setTimeout(() => {
      Promise.all([
        fetchBillings(),
        fetchPayments()
      ]).catch(err => {
        console.error("Error refreshing data:", err);
      });
    }, 100); // 100ms debounce
    
    return () => clearTimeout(timeout);
  }, [fetchBillings, fetchPayments]);

  useEffect(() => {
    console.log("Initial data fetch in useBillingData...");
    setIsLoading(true);
    
    Promise.all([
      fetchBillings(),
      fetchPayments(),
      fetchClients(),
      fetchTemplates()
    ]).catch(err => {
      console.error("Error loading initial data:", err);
    }).finally(() => {
      setIsLoading(false);
    });

    // Subscribe to changes in both tables
    const billingChannel = supabase
      .channel('billing-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recurring_billing' },
        () => {
          console.log('Recurring billing changes detected, refreshing data...');
          debouncedRefresh();
        }
      )
      .subscribe();

    const paymentsChannel = supabase
      .channel('payment-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          console.log('Payment changes detected, refreshing data...');
          fetchPayments();
        }
      )
      .subscribe();

    const templatesChannel = supabase
      .channel('template-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'email_templates' },
        () => {
          console.log('Template changes detected, refreshing data...');
          fetchTemplates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(billingChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(templatesChannel);
    };
  }, [fetchBillings, fetchPayments, fetchClients, fetchTemplates, debouncedRefresh]);

  return {
    billings,
    payments,
    clients,
    templates,
    isLoading,
    fetchBillings,
    fetchPayments
  };
};
