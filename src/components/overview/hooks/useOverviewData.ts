
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getPeriodDates } from "../utils/overviewUtils";
import type { Payment } from "@/types/payment";

interface TopClient {
  client_id: string;
  client_name: string;
  total_amount: number;
}

interface FutureProjection {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export const useOverviewData = (period: string) => {
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [futureProjections, setFutureProjections] = useState<FutureProjection[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingTopClients, setLoadingTopClients] = useState(false);
  const [projectionsLoading, setProjectionsLoading] = useState(false);

  const fetchPendingPayments = useCallback(async () => {
    setLoadingPayments(true);
    
    try {
      const dates = getPeriodDates(period);
      
      const { data: oneTimePayments, error: oneTimeError } = await supabase
        .from('payments')
        .select(`
          *,
          clients (
            name,
            email,
            partner_name
          )
        `)
        .in('status', ['pending', 'awaiting_invoice', 'billed', 'partially_paid', 'overdue'])
        .gte('due_date', dates.start)
        .lte('due_date', dates.end)
        .order('due_date', { ascending: true });
      
      if (oneTimeError) {
        throw oneTimeError;
      }
      
      const filteredOneTimePayments = (oneTimePayments || []).filter(payment => 
        typeof payment.id === 'string' && !payment.id.startsWith('recurring-')
      );
      
      filteredOneTimePayments.sort((a, b) => {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
      
      setPendingPayments(filteredOneTimePayments);
      
      console.log('Filtered pending payments (excluding recurring- prefixed IDs):', filteredOneTimePayments);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
    } finally {
      setLoadingPayments(false);
    }
  }, [period]);

  const fetchTopClients = useCallback(async () => {
    setLoadingTopClients(true);
    
    try {
      const dates = getPeriodDates(period);
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          amount,
          client_id,
          clients (
            name
          )
        `)
        .eq('status', 'paid')
        .gte('payment_date', dates.start)
        .lte('payment_date', dates.end);
      
      if (paymentsError) {
        throw paymentsError;
      }
      
      const clientTotals: Record<string, { client_id: string; client_name: string; total_amount: number }> = {};
      
      if (paymentsData) {
        paymentsData.forEach((payment: any) => {
          const clientId = payment.client_id;
          const clientName = payment.clients?.name || 'Cliente';
          const amount = payment.amount || 0;
          
          if (clientTotals[clientId]) {
            clientTotals[clientId].total_amount += amount;
          } else {
            clientTotals[clientId] = {
              client_id: clientId,
              client_name: clientName,
              total_amount: amount
            };
          }
        });
      }
      
      const sortedClients = Object.values(clientTotals).sort((a, b) => 
        b.total_amount - a.total_amount
      ).slice(0, 5);
      
      setTopClients(sortedClients);
      
      console.log('Top clients data:', sortedClients);
    } catch (error) {
      console.error("Error fetching top clients:", error);
    } finally {
      setLoadingTopClients(false);
    }
  }, [period]);

  const fetchFutureProjections = useCallback(async () => {
    setProjectionsLoading(true);
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const projections: FutureProjection[] = [];
      
      const endDate = new Date(currentYear, currentMonth + 12, 0);
      const { data: allPaymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .gte('due_date', new Date().toISOString().split('T')[0])
        .lte('due_date', endDate.toISOString().split('T')[0])
        .in('status', ['pending', 'awaiting_invoice', 'billed', 'partially_paid', 'overdue']);
      
      if (paymentsError) throw paymentsError;
      
      const { data: estimatedExpensesData, error: expensesError } = await supabase
        .from('estimated_expenses')
        .select('*');
      
      if (expensesError) throw expensesError;
      
      for (let i = 0; i < 12; i++) {
        const monthDate = new Date(currentYear, currentMonth + i, 1);
        const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth() + 1;
        
        const monthlyRevenue = (allPaymentsData || []).reduce((sum, payment) => {
          const dueDate = new Date(payment.due_date);
          const paymentYear = dueDate.getFullYear();
          const paymentMonth = dueDate.getMonth() + 1;
          
          if (paymentYear === year && paymentMonth === month) {
            if (payment.status === 'partially_paid' && payment.paid_amount) {
              return sum + (Number(payment.amount) - Number(payment.paid_amount));
            }
            return sum + Number(payment.amount);
          }
          return sum;
        }, 0);
        
        const monthlyExpenses = (estimatedExpensesData || []).reduce((sum, expense) => {
          return sum + Number(expense.amount);
        }, 0);
        
        const profit = monthlyRevenue - monthlyExpenses;
        
        projections.push({
          month: monthName,
          revenue: parseFloat(monthlyRevenue.toFixed(2)),
          expenses: parseFloat(monthlyExpenses.toFixed(2)),
          profit: parseFloat(profit.toFixed(2))
        });
      }
      
      setFutureProjections(projections);
      
    } catch (error) {
      console.error("Error fetching future projections:", error);
    } finally {
      setProjectionsLoading(false);
    }
  }, []);

  return {
    pendingPayments,
    topClients,
    futureProjections,
    loadingPayments,
    loadingTopClients,
    projectionsLoading,
    fetchPendingPayments,
    fetchTopClients,
    fetchFutureProjections
  };
};
