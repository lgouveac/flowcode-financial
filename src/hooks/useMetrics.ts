import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Metrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeClients: number;
  expectedRevenue: number;
  revenueChange: string;
  expensesChange: string;
  profitChange: string;
  clientsChange: string;
  expectedRevenueChange: string;
  // New metrics for category breakdown
  investmentExpenses: number;
  proLaboreExpenses: number;
  profitDistributionExpenses: number;
  operationalExpenses: number;
  adjustedProfit: number;
  // Changes for new metrics
  investmentChange: string;
  proLaboreChange: string;
  profitDistributionChange: string;
}

interface UseMetricsOptions {
  customStartDate?: Date;
  customEndDate?: Date;
}

export const useMetrics = (period: string = 'current', options?: UseMetricsOptions) => {
  const [metrics, setMetrics] = useState<Metrics>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    activeClients: 0,
    expectedRevenue: 0,
    revenueChange: "0%",
    expensesChange: "0%",
    profitChange: "0%",
    clientsChange: "0",
    expectedRevenueChange: "0%",
    // Initialize new metrics
    investmentExpenses: 0,
    proLaboreExpenses: 0,
    profitDistributionExpenses: 0,
    operationalExpenses: 0,
    adjustedProfit: 0,
    // Initialize changes
    investmentChange: "0%",
    proLaboreChange: "0%",
    profitDistributionChange: "0%"
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
      case 'current_year':
        return {
          start: `${currentYear}-01-01`,
          end: `${currentYear}-12-31`,
          compareStart: `${currentYear - 1}-01-01`,
          compareEnd: `${currentYear - 1}-12-31`,
        };
      case 'previous_year':
        const previousYear = currentYear - 1;
        return {
          start: `${previousYear}-01-01`,
          end: `${previousYear}-12-31`,
          compareStart: `${previousYear - 1}-01-01`,
          compareEnd: `${previousYear - 1}-12-31`,
        };
      case 'custom':
        if (options?.customStartDate && options?.customEndDate) {
          const startDate = options.customStartDate.toISOString().split('T')[0];
          const endDate = options.customEndDate.toISOString().split('T')[0];
          
          // Calculate same period duration for comparison
          const timeDiff = options.customEndDate.getTime() - options.customStartDate.getTime();
          const compareEndDate = new Date(options.customStartDate.getTime() - 86400000); // Day before start
          const compareStartDate = new Date(compareEndDate.getTime() - timeDiff);
          
          return {
            start: startDate,
            end: endDate,
            compareStart: compareStartDate.toISOString().split('T')[0],
            compareEnd: compareEndDate.toISOString().split('T')[0],
          };
        }
        // Fallback to current month if custom dates not provided
        return {
          start: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
          end: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
          compareStart: `${currentYear}-${String(currentMonth - 1).padStart(2, '0')}-01`,
          compareEnd: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
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

  // Helper function to identify category types flexibly
  const categorizeExpense = (item: { category: string }) => {
    const category = (item.category || "").toLowerCase();
    
    // Match investment categories
    if (category.includes("invest") || category === "investment" || category === "investimento") {
      return "investment";
    }
    
    // Match pro labore categories 
    if (category.includes("pro_labore") || category.includes("pro labore") || 
        category === "pro labore" || category.includes("prolabore")) {
      return "pro_labore";
    }
    
    // Match profit distribution categories
    if (category.includes("profit") || category.includes("distribution") || 
        category.includes("lucro") || category === "lucros") {
      return "profit_distribution";
    }
    
    // Otherwise it's operational
    return "operational";
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const dates = getPeriodDates(period);
        
        // Buscar dados do período atual
        const { data: currentData, error: currentError } = await supabase
          .from('cash_flow')
          .select('type, amount, category')
          .gte('date', dates.start)
          .lt('date', dates.end);

        if (currentError) throw currentError;

        // Buscar dados do período anterior para comparação
        const { data: previousData, error: previousError } = await supabase
          .from('cash_flow')
          .select('type, amount, category')
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

        // Buscar APENAS pagamentos pontuais pendentes/overdue do mês atual da tabela payments
        // Excluindo APENAS pagamentos com ID que começa com "recurring-"
        const { data: expectedPayments, error: expectedPaymentsError } = await supabase
          .from('payments')
          .select('amount, paid_amount, status, installment_number, id')
          .in('status', ['pending', 'billed', 'awaiting_invoice', 'partially_paid', 'overdue'])
          .gte('due_date', dates.start)
          .lt('due_date', dates.end);

        if (expectedPaymentsError) throw expectedPaymentsError;

        // Buscar faturamento esperado do período anterior
        const { data: previousExpectedPayments, error: prevExpectedPaymentsError } = await supabase
          .from('payments')
          .select('amount, paid_amount, status, installment_number, id')
          .in('status', ['pending', 'billed', 'awaiting_invoice', 'partially_paid', 'overdue'])
          .gte('due_date', dates.compareStart)
          .lt('due_date', dates.compareEnd);

        if (prevExpectedPaymentsError) throw prevExpectedPaymentsError;

        // Calcular métricas do período atual
        const currentRevenue = currentData
          ?.filter(item => item.type === 'income')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        const currentExpenses = currentData
          ?.filter(item => item.type === 'expense')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        // Calculate category-specific expenses for current period using flexible matching
        const currentInvestmentExpenses = currentData
          ?.filter(item => item.type === 'expense' && categorizeExpense(item) === 'investment')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;
          
        const currentProLaboreExpenses = currentData
          ?.filter(item => item.type === 'expense' && categorizeExpense(item) === 'pro_labore')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;
          
        const currentProfitDistributionExpenses = currentData
          ?.filter(item => item.type === 'expense' && categorizeExpense(item) === 'profit_distribution')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;
          
        // Calculate operational expenses (excluding special categories)
        const currentOperationalExpenses = currentExpenses - (currentInvestmentExpenses + currentProLaboreExpenses + currentProfitDistributionExpenses);
        
        // Calculate adjusted profit
        const adjustedProfit = currentRevenue - currentOperationalExpenses;

        // Calculate category-specific expenses for previous period
        const previousInvestmentExpenses = previousData
          ?.filter(item => item.type === 'expense' && categorizeExpense(item) === 'investment')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;
          
        const previousProLaboreExpenses = previousData
          ?.filter(item => item.type === 'expense' && categorizeExpense(item) === 'pro_labore')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;
          
        const previousProfitDistributionExpenses = previousData
          ?.filter(item => item.type === 'expense' && categorizeExpense(item) === 'profit_distribution')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        // Calcular métricas do período anterior
        const previousRevenue = previousData
          ?.filter(item => item.type === 'income')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        const previousExpenses = previousData
          ?.filter(item => item.type === 'expense')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        // Calcular faturamento esperado atual - APENAS pagamentos pontuais da tabela payments
        // Filtrar APENAS por ID para excluir qualquer pagamento com prefixo "recurring-"
        const filteredExpectedPayments = expectedPayments?.filter(payment => 
          typeof payment.id === 'string' && !payment.id.startsWith('recurring-')
        ) || [];

        const currentExpectedRevenue = filteredExpectedPayments
          .reduce((sum, item) => {
            // For partially paid payments, only count the remaining amount
            if (item.status === 'partially_paid' && item.paid_amount) {
              return sum + (Number(item.amount) - Number(item.paid_amount));
            }
            return sum + Number(item.amount);
          }, 0);

        // Calcular faturamento esperado anterior
        const filteredPreviousExpectedPayments = previousExpectedPayments?.filter(payment => 
          typeof payment.id === 'string' && !payment.id.startsWith('recurring-')
        ) || [];

        const previousExpectedRevenue = filteredPreviousExpectedPayments
          .reduce((sum, item) => {
            // For partially paid payments, only count the remaining amount
            if (item.status === 'partially_paid' && item.paid_amount) {
              return sum + (Number(item.amount) - Number(item.paid_amount));
            }
            return sum + Number(item.amount);
          }, 0);

        const currentNetProfit = currentRevenue - currentExpenses;
        const previousNetProfit = previousRevenue - previousExpenses;

        console.log('Expected revenue calculation (ONLY one-time payments from payments table):', {
          filteredPayments: filteredExpectedPayments,
          total: currentExpectedRevenue
        });

        setMetrics({
          totalRevenue: currentRevenue,
          totalExpenses: currentExpenses,
          netProfit: currentNetProfit,
          activeClients: currentClients?.length || 0,
          expectedRevenue: currentExpectedRevenue,
          revenueChange: calculatePercentageChange(currentRevenue, previousRevenue),
          expensesChange: calculatePercentageChange(currentExpenses, previousExpenses),
          profitChange: calculatePercentageChange(currentNetProfit, previousNetProfit),
          clientsChange: `+${(currentClients?.length || 0) - (previousClients?.length || 0)}`,
          expectedRevenueChange: calculatePercentageChange(currentExpectedRevenue, previousExpectedRevenue),
          // Add new metrics
          investmentExpenses: currentInvestmentExpenses,
          proLaboreExpenses: currentProLaboreExpenses,
          profitDistributionExpenses: currentProfitDistributionExpenses,
          operationalExpenses: currentOperationalExpenses,
          adjustedProfit: adjustedProfit,
          // Add changes for new metrics
          investmentChange: calculatePercentageChange(currentInvestmentExpenses, previousInvestmentExpenses),
          proLaboreChange: calculatePercentageChange(currentProLaboreExpenses, previousProLaboreExpenses),
          profitDistributionChange: calculatePercentageChange(currentProfitDistributionExpenses, previousProfitDistributionExpenses)
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
  }, [period, options?.customStartDate, options?.customEndDate]);

  return { metrics, isLoading };
};
