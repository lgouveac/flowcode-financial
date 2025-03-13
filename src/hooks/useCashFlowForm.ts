
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Payment } from "@/types/payment";

export const useCashFlowForm = ({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) => {
  const { toast } = useToast();
  const [movementType, setMovementType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category === 'payment') {
      fetchPendingPayments();
    } else {
      // Clear payments data if we're not showing payment options
      setPayments([]);
      setSelectedPayment('');
    }
  }, [category]);

  const fetchPendingPayments = async () => {
    console.log('Fetching pending payments...');
    setIsLoading(true);
    setError(null);
    
    try {
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
        .in('status', ['pending', 'billed', 'awaiting_invoice']);

      if (error) {
        console.error('Error fetching payments:', error);
        setError(error.message);
        toast({
          title: "Erro ao carregar pagamentos",
          description: "Não foi possível carregar os pagamentos pendentes.",
          variant: "destructive",
        });
        setPayments([]);
        return;
      }

      console.log('Fetched payments:', data);
      setPayments(data || []);
    } catch (err) {
      console.error('Exception fetching payments:', err);
      setError('Unexpected error occurred');
      toast({
        title: "Erro ao carregar pagamentos",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop propagation to prevent any parent form submission
    
    if (category === 'payment' && !selectedPayment) {
      toast({
        title: "Selecione um pagamento",
        description: "É necessário selecionar um pagamento para continuar.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const newCashFlow = {
        type: movementType,
        category,
        description,
        amount: Number(amount),
        date,
        payment_id: category === 'payment' ? selectedPayment : null,
      };

      console.log("Saving cash flow:", newCashFlow);

      const { error: cashFlowError } = await supabase
        .from('cash_flow')
        .insert([newCashFlow]);

      if (cashFlowError) {
        console.error('Error creating cash flow:', cashFlowError);
        toast({
          title: "Erro",
          description: "Não foi possível registrar a movimentação.",
          variant: "destructive",
        });
        return;
      }

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
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a movimentação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    movementType,
    setMovementType,
    category,
    setCategory,
    description,
    setDescription,
    amount,
    setAmount,
    date,
    setDate,
    selectedPayment,
    setSelectedPayment,
    payments,
    isSubmitting,
    isLoading,
    error,
    handleSubmit,
  };
};
