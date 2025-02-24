
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CashFlow, validateCashFlowType } from "@/types/cashflow";
import { useToast } from "@/components/ui/use-toast";

export const useCashFlow = (period: string = 'current') => {
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const { toast } = useToast();

  const getPeriodDates = (selectedPeriod: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    switch (selectedPeriod) {
      case 'current':
        return {
          start: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
          end: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
        };
      case 'last_month':
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        return {
          start: `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`,
          end: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
        };
      case 'last_3_months':
        const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
        return {
          start: threeMonthsAgo.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        };
      case 'last_6_months':
        const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
        return {
          start: sixMonthsAgo.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        };
      case 'last_year':
        const lastYear = new Date(now.setFullYear(now.getFullYear() - 1));
        return {
          start: lastYear.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        };
      default:
        return {
          start: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
          end: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
        };
    }
  };

  const fetchCashFlow = async () => {
    try {
      const dates = getPeriodDates(period);
      
      const { data, error } = await supabase
        .from('cash_flow')
        .select('*')
        .gte('date', dates.start)
        .lt('date', dates.end)
        .order('date', { ascending: true });

      if (error) throw error;

      // Transform the data to ensure type safety
      const transformedData: CashFlow[] = (data || []).map(item => ({
        ...item,
        type: validateCashFlowType(item.type), // This ensures type is either 'income' or 'expense'
        id: item.id,
        description: item.description,
        amount: item.amount,
        date: item.date,
        category: item.category,
        payment_id: item.payment_id || undefined,
        created_at: item.created_at || undefined,
        updated_at: item.updated_at || undefined
      }));

      setCashFlow(transformedData);

      // Process data for the chart
      const chartDataMap = new Map();
      
      transformedData.forEach((flow) => {
        const date = new Date(flow.date).toLocaleDateString('pt-BR');
        const currentData = chartDataMap.get(date) || {
          name: date,
          entrada: 0,
          saida: 0,
          saldo: 0,
        };

        if (flow.type === 'income') {
          currentData.entrada += Number(flow.amount);
        } else {
          currentData.saida += Number(flow.amount);
        }

        currentData.saldo = currentData.entrada - currentData.saida;
        chartDataMap.set(date, currentData);
      });

      setChartData(Array.from(chartDataMap.values()));

    } catch (error) {
      console.error('Error fetching cash flow:', error);
      toast({
        title: "Erro ao carregar fluxo de caixa",
        description: "Não foi possível carregar os dados do fluxo de caixa.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCashFlow();
  }, [period]);

  return {
    cashFlow,
    chartData,
    onNewCashFlow: fetchCashFlow,
  };
};

