import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { EstimatedExpense } from "@/types/employee";

export interface EstimatedExpenses {
  totalEstimatedExpenses: number;
  totalEstimatedExpensesChange: string;
}

// Create a refetch function as a singleton
let refetchEstimatedExpenses: (() => void) | null = null;

export const useEstimatedExpenses = (period: string = 'current') => {
  const { toast } = useToast();
  const [estimatedExpenses, setEstimatedExpenses] = useState<EstimatedExpenses>({
    totalEstimatedExpenses: 0,
    totalEstimatedExpensesChange: "0%"
  });
  const [isLoading, setIsLoading] = useState(true);

  // Same function from useMetrics to get periods
  const getPeriodDates = (selectedPeriod: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    switch (selectedPeriod) {
      case 'current':
        return {
          start: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
          end: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
          compareStart: `${currentYear}-${String(currentMonth - 1).padStart(2, '0')}-01`,
          compareEnd: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
        };
      case 'last_month':
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        return {
          start: `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`,
          end: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
          compareStart: `${lastMonthYear}-${String(lastMonth - 1).padStart(2, '0')}-01`,
          compareEnd: `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`,
        };
      case 'last_3_months':
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return {
          start: threeMonthsAgo.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
          compareStart: new Date(threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)).toISOString().split('T')[0],
          compareEnd: threeMonthsAgo.toISOString().split('T')[0],
        };
      case 'last_6_months':
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return {
          start: sixMonthsAgo.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
          compareStart: new Date(sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)).toISOString().split('T')[0],
          compareEnd: sixMonthsAgo.toISOString().split('T')[0],
        };
      case 'last_year':
        const lastYear = new Date(now);
        lastYear.setFullYear(now.getFullYear() - 1);
        return {
          start: lastYear.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
          compareStart: new Date(lastYear.setFullYear(lastYear.getFullYear() - 1)).toISOString().split('T')[0],
          compareEnd: lastYear.toISOString().split('T')[0],
        };
      default:
        return {
          start: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
          end: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
          compareStart: `${currentYear}-${String(currentMonth - 1).padStart(2, '0')}-01`,
          compareEnd: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
        };
    }
  };

  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) return "+0%";
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  const fetchEstimatedExpenses = async () => {
    try {
      setIsLoading(true);
      const dates = getPeriodDates(period);
      
      // Fetch estimated expenses for current period
      const { data: currentFixedExpenses, error: currentFixedError } = await supabase
        .from('estimated_expenses')
        .select('*')
        .eq('is_recurring', true)
        .or(`start_date.lte.${dates.end},start_date.is.null`)
        .or(`end_date.gte.${dates.start},end_date.is.null`);

      if (currentFixedError) throw currentFixedError;

      // Fetch estimated expenses for previous period
      const { data: previousFixedExpenses, error: previousFixedError } = await supabase
        .from('estimated_expenses')
        .select('*')
        .eq('is_recurring', true)
        .or(`start_date.lte.${dates.compareEnd},start_date.is.null`)
        .or(`end_date.gte.${dates.compareStart},end_date.is.null`);

      if (previousFixedError) throw previousFixedError;

      // Calculate estimated expenses
      const currentEstimatedExpenses = currentFixedExpenses?.reduce((sum, item) => 
        sum + Number(item.amount), 0) || 0;
        
      const previousEstimatedExpenses = previousFixedExpenses?.reduce((sum, item) => 
        sum + Number(item.amount), 0) || 0;

      // Calculate change percentage
      const totalEstimatedExpensesChange = calculatePercentageChange(
        currentEstimatedExpenses,
        previousEstimatedExpenses
      );

      setEstimatedExpenses({
        totalEstimatedExpenses: currentEstimatedExpenses,
        totalEstimatedExpensesChange
      });

      console.log('Estimated expenses calculated:', {
        totalEstimatedExpenses: currentEstimatedExpenses,
        totalEstimatedExpensesChange
      });

    } catch (error) {
      console.error('Error fetching estimated expenses:', error);
      toast({
        title: "Erro ao carregar despesas estimadas",
        description: "Não foi possível calcular as despesas estimadas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimatedExpenses();
    // Store the refetch function
    refetchEstimatedExpenses = fetchEstimatedExpenses;
    
    return () => {
      // Cleanup when component unmounts
      if (refetchEstimatedExpenses === fetchEstimatedExpenses) {
        refetchEstimatedExpenses = null;
      }
    };
  }, [period]);

  // Expose the refetch function
  useEstimatedExpenses.refetchEstimatedExpenses = refetchEstimatedExpenses;

  return { estimatedExpenses, isLoading };
};
