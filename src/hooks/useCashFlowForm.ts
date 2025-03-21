
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
      // Define valid statuses explicitly with the correct type
      const validStatuses: ("pending" | "billed" | "awaiting_invoice")[] = ['pending', 'billed', 'awaiting_invoice'];
      
      console.log('Querying payments with statuses:', validStatuses);
      
      // Modified query to ensure we're only getting payments with valid statuses
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
        .in('status', validStatuses);

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

      console.log('Raw database response for payments:', data);
      console.log('Number of payments returned from database:', data?.length || 0);
      
      if (!Array.isArray(data)) {
        console.error('Unexpected data format, expected array but got:', typeof data);
        setPayments([]);
        return;
      }
      
      // Log each payment and its status for debugging
      if (data && data.length > 0) {
        console.log('Individual payments and statuses:');
        data.forEach((payment, index) => {
          console.log(`Payment ${index + 1}:`, { 
            id: payment.id,
            description: payment.description,
            status: payment.status,
            amount: payment.amount
          });
        });
      }
      
      // Double check to ensure only valid statuses are included
      const filteredPayments = data.filter(payment => 
        payment && 
        payment.status && 
        validStatuses.includes(payment.status as any)
      );
        
      console.log('Final filtered payments to use:', filteredPayments);
      console.log('Number of payments after filtering:', filteredPayments.length);
      console.log('Payments statuses in result:', filteredPayments.map(p => p.status));
      
      // Set the filtered payments
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
