
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { RecurringBilling as RecurringBillingType } from "@/types/billing";
import { NewRecurringBillingForm } from "./recurring-billing/NewRecurringBillingForm";
import { BillingTable } from "./recurring-billing/BillingTable";

export const RecurringBilling = () => {
  const [billings, setBillings] = useState<RecurringBillingType[]>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Recebimentos Recorrentes</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Recebimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Recebimento Recorrente</DialogTitle>
            </DialogHeader>
            <NewRecurringBillingForm
              clients={clients}
              onSubmit={handleNewBilling}
              onClose={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <BillingTable billings={billings} />
    </div>
  );
};
