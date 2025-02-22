
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CashFlow as CashFlowType } from "@/types/cashflow";
import { validateCashFlowType } from "@/types/cashflow";
import { useToast } from "@/components/ui/use-toast";

export const useCashFlow = () => {
  const { toast } = useToast();
  const [cashFlow, setCashFlow] = useState<CashFlowType[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const processChartData = (data: CashFlowType[]) => {
    const groupedData = data.reduce((acc: Record<string, { income: number; expense: number }>, item) => {
      const monthYear = new Date(item.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      if (!acc[monthYear]) {
        acc[monthYear] = { income: 0, expense: 0 };
      }

      if (item.type === 'income') {
        acc[monthYear].income += Number(item.amount);
      } else {
        acc[monthYear].expense += Number(item.amount);
      }

      return acc;
    }, {});

    const chartData = Object.entries(groupedData).map(([name, values]) => ({
      name,
      entrada: values.income,
      saida: values.expense,
      saldo: values.income - values.expense
    }));

    setChartData(chartData);
  };

  const fetchCashFlow = async () => {
    const { data, error } = await supabase
      .from('cash_flow')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching cash flow:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o fluxo de caixa.",
        variant: "destructive",
      });
      return;
    }

    const typeSafeCashFlow = data?.map(item => ({
      ...item,
      type: validateCashFlowType(item.type)
    })) || [];

    setCashFlow(typeSafeCashFlow);
    processChartData(typeSafeCashFlow);
  };

  useEffect(() => {
    fetchCashFlow();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_flow' },
        () => {
          console.log('Cash flow changes detected, refreshing...');
          fetchCashFlow();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    cashFlow,
    chartData,
    fetchCashFlow
  };
};

