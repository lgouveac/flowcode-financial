
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Payment } from "@/types/payment";
import { NewPaymentForm } from "./payments/NewPaymentForm";
import { PaymentTable } from "./payments/PaymentTable";

export const OneTimePayment = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

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
        description: "Não foi possível carregar os recebimentos.",
        variant: "destructive",
      });
      return;
    }

    setPayments(data as Payment[]);
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
    fetchPayments();
    fetchClients();
  }, []);

  const handleNewPayment = async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('payments')
      .insert([payment])
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o recebimento.",
        variant: "destructive",
      });
      return;
    }

    setPayments(prev => [...prev, data as Payment]);
    setDialogOpen(false);
    toast({
      title: "Sucesso",
      description: "Recebimento criado com sucesso.",
    });
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Recebimentos Pontuais</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Recebimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Recebimento Pontual</DialogTitle>
            </DialogHeader>
            <NewPaymentForm
              clients={clients}
              onSubmit={handleNewPayment}
              onClose={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <PaymentTable payments={payments} />
    </div>
  );
};
