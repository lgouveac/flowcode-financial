import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/types/cashflow-categories";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Payment } from "@/types/payment";

interface NewCashFlowFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

interface PaymentWithClient extends Payment {
  clients: {
    name: string;
  };
}

export const NewCashFlowForm = ({ onSuccess, onClose }: NewCashFlowFormProps) => {
  const { toast } = useToast();
  const [movementType, setMovementType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [payments, setPayments] = useState<PaymentWithClient[]>([]);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (category === 'payment') {
      fetchPendingPayments();
    }
  }, [category]);

  const fetchPendingPayments = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        clients (
          name
        )
      `)
      .in('status', ['pending', 'billed', 'awaiting_invoice']);

    if (error) {
      console.error('Error fetching payments:', error);
      return;
    }

    setPayments(data || []);
  };

  const handlePaymentSelect = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      setSelectedPayment(paymentId);
      setAmount(payment.amount.toString());
      setDescription(payment.description);
      setOpen(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newCashFlow = {
      type: movementType,
      category,
      description,
      amount: Number(amount),
      date,
      payment_id: category === 'payment' ? selectedPayment : null,
    };

    // Inserir o cash flow
    const { error: cashFlowError } = await supabase
      .from('cash_flow')
      .insert([newCashFlow])
      .select()
      .single();

    if (cashFlowError) {
      console.error('Error creating cash flow:', cashFlowError);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a movimentação.",
        variant: "destructive",
      });
      return;
    }

    // Se for um pagamento, atualizar o status do pagamento para 'paid'
    if (category === 'payment' && selectedPayment) {
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          payment_date: date
        })
        .eq('id', selectedPayment);

      if (paymentError) {
        console.error('Error updating payment:', paymentError);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o status do pagamento.",
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Sucesso",
      description: "Movimentação registrada com sucesso.",
    });

    onSuccess();
    onClose();
  };

  const filteredPayments = payments.filter(payment => {
    const searchLower = searchValue.toLowerCase();
    return (
      payment.clients.name.toLowerCase().includes(searchLower) ||
      payment.description.toLowerCase().includes(searchLower) ||
      payment.amount.toString().includes(searchLower)
    );
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova Movimentação</DialogTitle>
        <DialogDescription>
          Adicione uma nova movimentação ao fluxo de caixa
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Tipo</Label>
            <Select value={movementType} onValueChange={(value: 'income' | 'expense') => setMovementType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Entrada</SelectItem>
                <SelectItem value="expense">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES[movementType].map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {category === 'payment' && (
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Recebimento</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedPayment ? (
                    payments.find((payment) => payment.id === selectedPayment)?.description
                  ) : (
                    "Selecione um recebimento..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Busque por cliente, descrição ou valor..." 
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandEmpty>
                    <div className="py-6 text-center">
                      <p className="text-base text-muted-foreground">
                        Nenhum recebimento encontrado
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Tente buscar usando outros termos ou verifique se existem recebimentos pendentes
                      </p>
                    </div>
                  </CommandEmpty>
                  <CommandGroup className="max-h-[300px] overflow-auto">
                    {filteredPayments.map(payment => (
                      <CommandItem
                        key={payment.id}
                        value={payment.id}
                        onSelect={() => handlePaymentSelect(payment.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedPayment === payment.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{payment.clients.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {payment.description} - {formatCurrency(payment.amount)}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Data</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Valor</Label>
            <Input 
              type="number" 
              step="0.01" 
              placeholder="0,00" 
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              disabled={category === 'payment'} 
            />
          </div>
        </div>
        <div className="space-y-2.5">
          <Label className="text-sm font-medium">Descrição</Label>
          <Input 
            placeholder="Descrição da movimentação" 
            value={description} 
            onChange={e => setDescription(e.target.value)}
            disabled={category === 'payment'} 
          />
        </div>
        <Button type="submit" className="w-full mt-6">
          Adicionar Movimentação
        </Button>
      </form>
    </DialogContent>
  );
};
