
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { CATEGORIES } from "@/types/cashflow-categories";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Payment } from "@/types/payment";

interface NewCashFlowFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const NewCashFlowForm = ({ onSuccess, onClose }: NewCashFlowFormProps) => {
  const { toast } = useToast();
  const [movementType, setMovementType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [payments, setPayments] = useState<Payment[]>([]);

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
    }
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
            <Select value={selectedPayment} onValueChange={handlePaymentSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o recebimento" />
              </SelectTrigger>
              <SelectContent>
                {payments.map(payment => (
                  <SelectItem key={payment.id} value={payment.id}>
                    {payment.clients?.name} - {payment.description} - R$ {payment.amount}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
