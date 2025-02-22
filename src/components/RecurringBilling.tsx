
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

    setBillings(data || []);
  };

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        clients (
          name
        )
      `);

    if (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os recebimentos pontuais.",
        variant: "destructive",
      });
      return;
    }

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
  }, []);

  const handleNewBilling = async (billing: RecurringBillingType) => {
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

    setBillings(prev => [...prev, data]);
    setDialogOpen(false);
    toast({
      title: "Sucesso",
      description: "Recebimento recorrente criado com sucesso.",
    });
  };

  const handleNewPayment = async (payment: Payment) => {
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
