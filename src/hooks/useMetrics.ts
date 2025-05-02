
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

export const useMetrics = (period: string = 'current') => {
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
        
        // Fetch data for current period
        const { data: currentData, error: currentError } = await supabase
          .from('cash_flow')
          .select('type, amount, category')
          .gte('date', dates.start)
          .lt('date', dates.end);

        if (currentError) throw currentError;

        // Fetch data for previous comparison period
        const { data: previousData, error: previousError } = await supabase
          .from('cash_flow')
          .select('type, amount, category')
          .gte('date', dates.compareStart)
          .lt('date', dates.compareEnd);

        if (previousError) throw previousError;

        // Fetch active clients
        const { data: currentClients, error: clientsError } = await supabase
          .from('clients')
          .select('id')
          .eq('status', 'active');

        if (clientsError) throw clientsError;

        // Fetch previous active clients
        const { data: previousClients, error: previousClientsError } = await supabase
          .from('clients')
          .select('id')
          .eq('status', 'active')
          .lt('created_at', dates.start);

        if (previousClientsError) throw previousClientsError;

        // FIXED: Fetch pending payments - don't filter by date to get all pending
        const { data: expectedPayments, error: expectedPaymentsError } = await supabase
          .from('payments')
          .select('amount, paid_amount, status')
          .in('status', ['pending', 'billed', 'awaiting_invoice', 'partially_paid']);

        if (expectedPaymentsError) throw expectedPaymentsError;
        
        // Log for debugging
        console.log('All expected payments for calculation:', expectedPayments);

        // FIXED: Fetch recurring billing data - count each billing only once
        const { data: expectedRecurring, error: expectedRecurringError } = await supabase
          .from('recurring_billing')
          .select('amount, due_day, status, installments, current_installment')
          .in('status', ['pending', 'billed', 'awaiting_invoice', 'partially_paid']);

        if (expectedRecurringError) throw expectedRecurringError;
        
        console.log('All expected recurring billing for calculation:', expectedRecurring);

        // Calculate current expected payments total - correctly handling partially paid payments
        const currentExpectedPaymentsTotal = (expectedPayments || [])
          .reduce((sum, item) => {
            if (item.status === 'partially_paid' && item.paid_amount) {
              return sum + (Number(item.amount) - Number(item.paid_amount));
            }
            return sum + Number(item.amount);
          }, 0);
        
        // FIXED: For recurring payments, count each billing only once
        const currentExpectedRecurringTotal = (expectedRecurring || [])
          .reduce((sum, item) => sum + Number(item.amount), 0);
        
        // Total expected revenue is the sum of both types
        const currentExpectedRevenue = currentExpectedPaymentsTotal + currentExpectedRecurringTotal;
        
        // Detailed logging to track calculation
        console.log('Expected revenue calculation details:', {
          oneTimePayments: currentExpectedPaymentsTotal,
          recurringPayments: currentExpectedRecurringTotal,
          total: currentExpectedRevenue,
          numberOfPayments: expectedPayments?.length || 0,
          numberOfRecurring: expectedRecurring?.length || 0
        });

        // Fetch previous expected payments
        const { data: previousExpectedPayments, error: prevExpectedPaymentsError } = await supabase
          .from('payments')
          .select('amount, paid_amount, status')
          .in('status', ['pending', 'billed', 'awaiting_invoice', 'partially_paid'])
          .lt('due_date', dates.compareEnd);

        if (prevExpectedPaymentsError) throw prevExpectedPaymentsError;

        // Calculate previous expected payments total
        const previousExpectedPaymentsTotal = (previousExpectedPayments || [])
          .reduce((sum, item) => {
            if (item.status === 'partially_paid' && item.paid_amount) {
              return sum + (Number(item.amount) - Number(item.paid_amount));
            }
            return sum + Number(item.amount);
          }, 0);

        // Calculate current period metrics
        const currentRevenue = currentData
          ?.filter(item => item.type === 'income')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        const currentExpenses = currentData
          ?.filter(item => item.type === 'expense')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        // Calculate category-specific expenses
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

        // Calculate previous period metrics
        const previousRevenue = previousData
          ?.filter(item => item.type === 'income')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        const previousExpenses = previousData
          ?.filter(item => item.type === 'expense')
          .reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        // Get previous recurring billings
        const { data: previousRecurring, error: prevRecurringError } = await supabase
          .from('recurring_billing')
          .select('amount')
          .in('status', ['pending', 'billed', 'awaiting_invoice', 'partially_paid']);
          
        if (prevRecurringError) throw prevRecurringError;
        
        // Calculate previous expected recurring total - count each once
        const previousExpectedRecurringTotal = (previousRecurring || [])
          .reduce((sum, item) => sum + Number(item.amount), 0);
          
        const previousExpectedRevenue = previousExpectedPaymentsTotal + previousExpectedRecurringTotal;

        // Calculate net profit
        const currentNetProfit = currentRevenue - currentExpenses;
        const previousNetProfit = previousRevenue - previousExpenses;

        console.log('Final expected revenue calculation:', {
          payments: expectedPayments?.length || 0,
          paymentTotal: currentExpectedPaymentsTotal,
          recurringTotal: currentExpectedRecurringTotal,
          total: currentExpectedRevenue
        });

        // Set metrics state with all calculated values
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
  }, [period]);

  return { metrics, isLoading };
};
