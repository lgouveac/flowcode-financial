
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Payment } from "@/types/payment";
import type { Employee } from "@/components/emails/types/emailTest";

export const useCashFlowForm = ({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) => {
  const { toast } = useToast();
  const [movementType, setMovementType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear payment data when category changes
  useEffect(() => {
    if (category === 'payment') {
      fetchPendingPayments();
    } else if (category === 'employee') {
      fetchEmployees();
    } else {
      // Clear data if we're not showing payment options
      setPayments([]);
      setSelectedPayment('');
      setEmployees([]);
      setSelectedEmployee('');
    }
  }, [category]);

  const fetchEmployees = async () => {
    console.log('Fetching employees...');
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, email')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error fetching employees:', error);
        setError(error.message);
        toast({
          title: "Erro ao carregar funcionários",
          description: "Não foi possível carregar a lista de funcionários.",
          variant: "destructive",
        });
        setEmployees([]);
        return;
      }

      console.log('Fetched employees:', data);
      setEmployees(data || []);
    } catch (err) {
      console.error('Exception fetching employees:', err);
      setError('Unexpected error occurred');
      toast({
        title: "Erro ao carregar funcionários",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingPayments = async () => {
    console.log('Fetching pending payments...');
    setIsLoading(true);
    setError(null);
    
    try {
      // Use an explicit IN clause to strictly filter by allowed statuses
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          client_id,
          description,
          amount,
          due_date,
          payment_date,
          payment_method,
          status,
          installment_number,
          total_installments,
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

      console.log('Fetched pending payments (filtered at database):', data);
      
      // Additional safety check to ensure only valid statuses are included
      const filteredPayments = Array.isArray(data) 
        ? data.filter(payment => 
            ['pending', 'billed', 'awaiting_invoice'].includes(payment.status)
          )
        : [];
        
      console.log('Final filtered payments:', filteredPayments);
      setPayments(filteredPayments);
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

    if (category === 'employee' && !selectedEmployee) {
      toast({
        title: "Selecione um funcionário",
        description: "É necessário selecionar um funcionário para continuar.",
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
        employee_id: category === 'employee' ? selectedEmployee : null,
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

      if (category === 'payment' && selectedPayment) {
        // Atualizar o status do pagamento para 'paid'
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
    selectedEmployee,
    setSelectedEmployee,
    payments,
    employees,
    isSubmitting,
    isLoading,
    error,
    handleSubmit,
  };
};
