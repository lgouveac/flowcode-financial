
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { RecurringBilling as RecurringBillingType } from "@/types/billing";

interface NewRecurringBillingFormProps {
  onSubmit: (billing: RecurringBillingType) => void;
  onClose: () => void;
  clients: Array<{ id: string; name: string }>;
}

const NewRecurringBillingForm = ({ onSubmit, onClose, clients }: NewRecurringBillingFormProps) => {
  const [formData, setFormData] = useState<Partial<RecurringBillingType>>({
    payment_method: 'pix',
    status: 'pending'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id || !formData.description || !formData.amount || !formData.due_day || !formData.start_date) {
      return;
    }
    onSubmit(formData as RecurringBillingType);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Cliente</Label>
        <Select onValueChange={(value) => setFormData({ ...formData, client_id: value })} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Dia do Vencimento</Label>
          <Input
            type="number"
            min="1"
            max="31"
            value={formData.due_day || ''}
            onChange={(e) => setFormData({ ...formData, due_day: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de Início</Label>
          <Input
            type="date"
            value={formData.start_date || ''}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Data Final (opcional)</Label>
          <Input
            type="date"
            value={formData.end_date || ''}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Método de Pagamento</Label>
        <Select 
          defaultValue="pix"
          onValueChange={(value: 'pix' | 'boleto' | 'credit_card') => 
            setFormData({ ...formData, payment_method: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="boleto">Boleto</SelectItem>
            <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar
        </Button>
      </div>
    </form>
  );
};

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

      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-4 font-medium">Cliente</th>
              <th className="p-4 font-medium">Descrição</th>
              <th className="p-4 font-medium">Valor</th>
              <th className="p-4 font-medium">Vencimento</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Método</th>
            </tr>
          </thead>
          <tbody>
            {billings.map((billing) => (
              <tr key={billing.id} className="border-t">
                <td className="p-4">{(billing as any).clients?.name}</td>
                <td className="p-4">{billing.description}</td>
                <td className="p-4">R$ {billing.amount.toFixed(2)}</td>
                <td className="p-4">Dia {billing.due_day}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    billing.status === 'paid' 
                      ? 'bg-green-100 text-green-800'
                      : billing.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : billing.status === 'overdue'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {billing.status === 'paid' ? 'Pago'
                      : billing.status === 'pending' ? 'Pendente'
                      : billing.status === 'overdue' ? 'Atrasado'
                      : 'Cancelado'}
                  </span>
                </td>
                <td className="p-4">
                  {billing.payment_method === 'pix' ? 'PIX'
                    : billing.payment_method === 'boleto' ? 'Boleto'
                    : 'Cartão de Crédito'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
