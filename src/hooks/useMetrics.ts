
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Metrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeClients: number;
  revenueChange: string;
  expensesChange: string;
  profitChange: string;
  clientsChange: string;
}

export const useMetrics = (period: string = 'current') => {
  const [metrics, setMetrics] = useState<Metrics>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    activeClients: 0,
    revenueChange: "0%",
    expensesChange: "0%",
    profitChange: "0%",
    clientsChange: "0",
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) return "+0%";
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

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
        const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
        return {
          start: threeMonthsAgo.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
          compareStart: new Date(threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)).toISOString().split('T')[0],
          compareEnd: threeMonthsAgo.toISOString().split('T')[0],
        };
      case 'last_6_months':
        const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
        return {
          start: sixMonthsAgo.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
          compareStart: new Date(sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)).toISOString().split('T')[0],
          compareEnd: sixMonthsAgo.toISOString().split('T')[0],
        };
      case 'last_year':
        const lastYear = new Date(now.setFullYear(now.getFullYear() - 1));
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

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const dates = getPeriodDates(period);
        
        // Buscar dados do período atual
        const { data: currentData, error: currentError } = await supabase
          .from('cash_flow')
          .select('type, amount')
          .gte('date', dates.start)
          .lt('date', dates.end);

        if (currentError) throw currentError;

        // Buscar dados do período anterior para comparação
        const { data: previousData, error: previousError } = await supabase
          .from('cash_flow')
          .select('type, amount')
          .gte('date', dates.compareStart)
          .lt('date', dates.compareEnd);

        if (previousError) throw previousError;

        // Buscar clientes ativos
        const { data: currentClients, error: clientsError } = await supabase
          .from('clients')
          .select('id')
          .eq('status', 'active');

        if (clientsError) throw clientsError;

        // Buscar clientes ativos do período anterior
        const { data: previousClients, error: previousClientsError } = await supabase
          .from('clients')
          .select('id')
          .eq('status', 'active')
          .lt('created_at', dates.start);

        if (previousClientsError) throw previousClientsError;

        // Calcular métricas do período atual
        const currentRevenue = currentData
          ?.filter(item => item.type === 'income')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        const currentExpenses = currentData
          ?.filter(item => item.type === 'expense')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        // Calcular métricas do período anterior
        const previousRevenue = previousData
          ?.filter(item => item.type === 'income')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        const previousExpenses = previousData
          ?.filter(item => item.type === 'expense')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        const currentNetProfit = currentRevenue - currentExpenses;
        const previousNetProfit = previousRevenue - previousExpenses;

        setMetrics({
          totalRevenue: currentRevenue,
          totalExpenses: currentExpenses,
          netProfit: currentNetProfit,
          activeClients: currentClients?.length || 0,
          revenueChange: calculatePercentageChange(currentRevenue, previousRevenue),
          expensesChange: calculatePercentageChange(currentExpenses, previousExpenses),
          profitChange: calculatePercentageChange(currentNetProfit, previousNetProfit),
          clientsChange: `+${(currentClients?.length || 0) - (previousClients?.length || 0)}`,
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
        toast({
          title: "Erro ao carregar métricas",
          description: "Não foi possível carregar as métricas do dashboard.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [period]);

  return { metrics, isLoading };
};
