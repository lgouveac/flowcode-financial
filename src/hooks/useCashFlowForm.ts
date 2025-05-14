
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useCashFlowForm = ({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) => {
  const { toast } = useToast();
  const [movementType, setMovementType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop propagation to prevent any parent form submission
    
    if (!category || !description || !amount || !date) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
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
        status: 'pending' as const
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
    isSubmitting,
    error,
    handleSubmit,
  };
};
