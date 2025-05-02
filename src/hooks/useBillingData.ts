
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RecurringBilling } from "@/types/billing";
import { Payment } from "@/types/payment";
import { EmailTemplate } from "@/types/email";
import { Client } from "@/types/client";
import { useToast } from "@/components/ui/use-toast";

export const useBillingData = () => {
  const [billings, setBillings] = useState<RecurringBilling[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch recurring billings
  const fetchBillings = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('recurring_billing')
        .select(`
          *,
          clients (
            name,
            responsible_name,
            partner_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Fetched recurring billings:', data);
      setBillings(data || []);
    } catch (error) {
      console.error('Error fetching recurring billings:', error);
      toast({
        title: "Erro ao carregar recebimentos recorrentes",
        description: "Não foi possível carregar os recebimentos recorrentes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch one-time payments - getting only current month payments for UI display
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current month's range
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const firstDayOfCurrentMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const lastDayOfCurrentMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
      
      console.log(`Fetching payments from ${firstDayOfCurrentMonth} to ${lastDayOfCurrentMonth}`);
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          clients (
            name,
            email,
            partner_name
          )
        `)
        .gte('due_date', firstDayOfCurrentMonth)
        .lte('due_date', lastDayOfCurrentMonth)
        .order('due_date', { ascending: true });

      if (error) throw error;

      console.log('Fetched current month payments:', data);
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Erro ao carregar pagamentos",
        description: "Não foi possível carregar os pagamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch clients
  const fetchClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, []);

  // Fetch email templates
  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('type', 'clients');

      if (error) throw error;

      // Convert template types to match EmailTemplate type
      const typedTemplates = data?.map(template => ({
        ...template,
        type: template.type as any,
        subtype: template.subtype as any
      }));
      
      setTemplates(typedTemplates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchBillings();
    fetchPayments();
    fetchClients();
    fetchTemplates();
  }, [fetchBillings, fetchPayments, fetchClients, fetchTemplates]);

  return { 
    billings,
    payments,
    clients,
    templates,
    loading,
    fetchBillings,
    fetchPayments,
    fetchClients,
    fetchTemplates
  };
};
