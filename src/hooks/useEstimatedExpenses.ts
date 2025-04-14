
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { EmployeeMonthlyValue } from "@/types/employee";
import { useState, useEffect } from "react";

export interface EstimatedExpenses {
  workerExpenses: number;
  workerExpensesChange: string;
  totalEstimatedExpenses: number;
  totalEstimatedExpensesChange: string;
  // Future fields for additional fixed expenses
}

export const useEstimatedExpenses = (period: string = 'current') => {
  const { toast } = useToast();
  const [estimatedExpenses, setEstimatedExpenses] = useState<EstimatedExpenses>({
    workerExpenses: 0,
    workerExpensesChange: "0%",
    totalEstimatedExpenses: 0,
    totalEstimatedExpensesChange: "0%",
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

  useEffect(() => {
    const fetchEstimatedExpenses = async () => {
      try {
        setIsLoading(true);
        const dates = getPeriodDates(period);
        
        // Fetch worker expenses for current period
        const { data: currentWorkerValues, error: currentWorkerError } = await supabase
          .from('employee_monthly_values')
          .select('amount')
          .gte('month', dates.start)
          .lt('month', dates.end);

        if (currentWorkerError) throw currentWorkerError;

        // Fetch worker expenses for previous period
        const { data: previousWorkerValues, error: previousWorkerError } = await supabase
          .from('employee_monthly_values')
          .select('amount')
          .gte('month', dates.compareStart)
          .lt('month', dates.compareEnd);

        if (previousWorkerError) throw previousWorkerError;

        // Calculate worker expenses
        const currentWorkerExpenses = currentWorkerValues?.reduce((sum, item) => 
          sum + Number(item.amount), 0) || 0;
        
        const previousWorkerExpenses = previousWorkerValues?.reduce((sum, item) => 
          sum + Number(item.amount), 0) || 0;

        // Calculate change percentages
        const workerExpensesChange = calculatePercentageChange(
          currentWorkerExpenses, 
          previousWorkerExpenses
        );

        // Currently total estimated expenses is just worker expenses
        // In the future, we'll add other fixed expenses here
        const totalEstimatedExpenses = currentWorkerExpenses;
        const totalEstimatedExpensesChange = workerExpensesChange;

        setEstimatedExpenses({
          workerExpenses: currentWorkerExpenses,
          workerExpensesChange,
          totalEstimatedExpenses,
          totalEstimatedExpensesChange
        });

        console.log('Estimated expenses calculated:', {
          workerExpenses: currentWorkerExpenses,
          workerExpensesChange,
          totalEstimatedExpenses,
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

    fetchEstimatedExpenses();
  }, [period, toast]);

  return { estimatedExpenses, isLoading };
};
