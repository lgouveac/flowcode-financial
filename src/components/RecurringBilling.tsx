
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { RecurringBilling as RecurringBillingType } from "@/types/billing";
import { NewRecurringBillingForm } from "./recurring-billing/NewRecurringBillingForm";
import { BillingTable } from "./recurring-billing/BillingTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Payment } from "@/types/payment";
import { NewPaymentForm } from "./payments/NewPaymentForm";
import { PaymentTable } from "./payments/PaymentTable";

export const RecurringBilling = () => {
  const [billings, setBillings] = useState<RecurringBillingType[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'recurring' | 'onetime'>('recurring');
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
      .order('due_date', { ascending: true });

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

  useEffect(() => {
    fetchBillings();
    fetchPayments();
    fetchClients();

    // Subscribe to changes in both tables
    const billingChannel = supabase
      .channel('billing-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recurring_billing' },
        (payload) => {
          console.log('Recurring billing changes detected:', payload);
          fetchBillings();
          // Importante: também buscar os pagamentos quando houver mudanças nos recebimentos recorrentes
          fetchPayments();
        }
      )
      .subscribe();

    const paymentsChannel = supabase
      .channel('payment-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          console.log('Payment changes detected:', payload);
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(billingChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, []);

  const handleNewBilling = async (billing: RecurringBillingType) => {
    console.log("Creating new billing:", billing);
    const { data, error } = await supabase
      .from('recurring_billing')
      .insert([billing])
      .select()
      .single();

    if (error) {
      console.error('Error creating billing:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o recebimento recorrente.",
        variant: "destructive",
      });
      return;
    }

    console.log("New billing created:", data);
    // Atualizar ambas as listas após criar um novo recebimento recorrente
    fetchBillings();
    fetchPayments();
    setDialogOpen(false);
    toast({
      title: "Sucesso",
      description: "Recebimento recorrente criado com sucesso.",
    });
  };

  const handleNewPayment = async (payment: Payment) => {
    console.log("Creating new payment:", payment);
    const { data, error } = await supabase
      .from('payments')
      .insert([payment])
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o recebimento pontual.",
        variant: "destructive",
      });
      return;
    }

    console.log("New payment created:", data);
    setPayments(prev => [...prev, data]);
    setDialogOpen(false);
    toast({
      title: "Sucesso",
      description: "Recebimento pontual criado com sucesso.",
    });
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Recebimentos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Recebimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Recebimento</DialogTitle>
              <DialogDescription>
                Escolha o tipo de recebimento que deseja criar
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue={paymentType} onValueChange={(value) => setPaymentType(value as 'recurring' | 'onetime')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recurring">Recorrente</TabsTrigger>
                <TabsTrigger value="onetime">Pontual</TabsTrigger>
              </TabsList>
              <TabsContent value="recurring">
                <NewRecurringBillingForm
                  clients={clients}
                  onSubmit={handleNewBilling}
                  onClose={() => setDialogOpen(false)}
                />
              </TabsContent>
              <TabsContent value="onetime">
                <NewPaymentForm
                  clients={clients}
                  onSubmit={handleNewPayment}
                  onClose={() => setDialogOpen(false)}
                />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="recurring" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="recurring">Recorrentes</TabsTrigger>
          <TabsTrigger value="onetime">Pontuais</TabsTrigger>
        </TabsList>
        <TabsContent value="recurring">
          <BillingTable billings={billings} />
        </TabsContent>
        <TabsContent value="onetime">
          <PaymentTable payments={payments} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
