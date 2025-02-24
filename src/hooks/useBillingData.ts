
import { useState, useEffect } from "react";
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
  const { toast } = useToast();

  const fetchBillings = async () => {
    console.log("Fetching billings...");
    const { data, error } = await supabase
      .from('recurring_billing')
      .select(`
        *,
        clients (
          name
        )
      `);

    if (error) {
      console.error('Error fetching billings:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os recebimentos recorrentes.",
        variant: "destructive",
      });
      return;
    }

    console.log("Billings fetched:", data);
    setBillings(data || []);
  };

  const fetchPayments = async () => {
    console.log("Fetching payments...");
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        clients (
          name
        )
      `)
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

    console.log("Payments fetched:", data);
    setPayments(data || []);
  };

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name');

    if (error) {
      console.error('Error fetching clients:', error);
      return;
    }

    setClients(data || []);
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*');

    if (error) {
      console.error('Error fetching templates:', error);
      return;
    }

    // Validate and transform the data to ensure it matches the EmailTemplate type
    const validTemplates = (data || []).filter((template): template is EmailTemplate => {
      // Check if template has all required fields
      if (!template.id || !template.name || !template.subject || !template.content || 
          !template.type || !template.subtype || !template.created_at || !template.updated_at) {
        console.warn('Template missing required fields:', template);
        return false;
      }

      // Check if the type is valid
      const validType = template.type === 'clients' || template.type === 'employees';
      if (!validType) {
        console.warn(`Invalid template type found: ${template.type}`);
        return false;
      }

      // Check if the subtype is valid
      const validSubtype = ['recurring', 'oneTime', 'invoice', 'hours'].includes(template.subtype);
      if (!validSubtype) {
        console.warn(`Invalid template subtype found: ${template.subtype}`);
        return false;
      }

      return true;
    });

    console.log("Templates fetched and validated:", validTemplates);
    setTemplates(validTemplates);
  };

  useEffect(() => {
    fetchBillings();
    fetchPayments();
    fetchClients();
    fetchTemplates();

    // Subscribe to changes in both tables
    const billingChannel = supabase
      .channel('billing-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recurring_billing' },
        () => {
          console.log('Recurring billing changes detected, refreshing data...');
          fetchBillings();
          fetchPayments();
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
  }, []);

  return {
    billings,
    payments,
    clients,
    templates,
    fetchBillings,
    fetchPayments
  };
};
