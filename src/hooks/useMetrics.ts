
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

export const useMetrics = () => {
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

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        
        const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

        // Buscar receitas e despesas do mês atual
        const { data: currentMonthData, error: currentError } = await supabase
          .from('cash_flow')
          .select('type, amount')
          .gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
          .lt('date', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`);

        if (currentError) throw currentError;

        // Buscar receitas e despesas do mês anterior
        const { data: previousMonthData, error: previousError } = await supabase
          .from('cash_flow')
          .select('type, amount')
          .gte('date', `${previousYear}-${String(previousMonth).padStart(2, '0')}-01`)
          .lt('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`);

        if (previousError) throw previousError;

        // Buscar clientes ativos
        const { data: currentClients, error: clientsError } = await supabase
          .from('clients')
          .select('id')
          .eq('status', 'active');

        if (clientsError) throw clientsError;

        // Buscar clientes ativos do mês anterior
        const { data: previousClients, error: previousClientsError } = await supabase
          .from('clients')
          .select('id')
          .eq('status', 'active')
          .lt('created_at', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`);

        if (previousClientsError) throw previousClientsError;

        // Calcular métricas do mês atual
        const currentRevenue = currentMonthData
          ?.filter(item => item.type === 'income')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        const currentExpenses = currentMonthData
          ?.filter(item => item.type === 'expense')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        // Calcular métricas do mês anterior
        const previousRevenue = previousMonthData
          ?.filter(item => item.type === 'income')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        const previousExpenses = previousMonthData
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
  }, []);

  return { metrics, isLoading };
};
