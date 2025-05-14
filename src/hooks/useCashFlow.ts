
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CashFlow, validateCashFlowType } from "@/types/cashflow";
import { useToast } from "@/hooks/use-toast";

export const useCashFlow = (period: string = 'current') => {
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const { toast } = useToast();

  const getPeriodDates = (selectedPeriod: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Log the selected period for debugging
    console.log('Selected period:', selectedPeriod);

    // Handle custom period formats like "2025-3" (year-month)
    if (selectedPeriod.includes('-')) {
      const parts = selectedPeriod.split('-');
      
      // Year-month format (e.g., "2025-3")
      if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
        const year = Number(parts[0]);
        const month = Number(parts[1]);
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextMonthYear = month === 12 ? year + 1 : year;
        
        // For debugging, log the calculated range
        console.log(`Date range for ${year}-${month}: from ${year}-${String(month).padStart(2, '0')}-01 to ${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-01`);
        
        return {
          start: `${year}-${String(month).padStart(2, '0')}-01`,
          end: `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-01`,
        };
      }
      
      // Handle quarter format (e.g., "quarter-2025")
      if (parts[0] === 'quarter') {
        const year = Number(parts[1]);
        const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;
        const quarterStartMonth = (currentQuarter - 1) * 3 + 1;
        const quarterEndMonth = quarterStartMonth + 3;
        const quarterEndYear = quarterEndMonth > 12 ? year + 1 : year;
        
        return {
          start: `${year}-${String(quarterStartMonth).padStart(2, '0')}-01`,
          end: quarterEndMonth > 12 
            ? `${quarterEndYear}-${String(quarterEndMonth - 12).padStart(2, '0')}-01`
            : `${year}-${String(quarterEndMonth).padStart(2, '0')}-01`,
        };
      }
      
      // Handle year format (e.g., "year-2025")
      if (parts[0] === 'year') {
        const year = Number(parts[1]);
        return {
          start: `${year}-01-01`,
          end: `${year + 1}-01-01`,
        };
      }
    }

    // Default period handlers from before
    switch (selectedPeriod) {
      case 'current':
        return {
          start: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
          end: `${currentMonth === 12 ? currentYear + 1 : currentYear}-${String(currentMonth === 12 ? 1 : currentMonth + 1).padStart(2, '0')}-01`,
        };
      case 'last_month':
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        return {
          start: `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`,
          end: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
        };
      case 'last_3_months':
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return {
          start: threeMonthsAgo.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        };
      case 'last_6_months':
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return {
          start: sixMonthsAgo.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        };
      case 'last_year':
        const lastYear = new Date();
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        return {
          start: lastYear.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        };
      default:
        // If the period doesn't match any known format, use current month as a safe default
        console.log(`Unknown period format "${selectedPeriod}", defaulting to current month`);
        return {
          start: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
          end: `${currentMonth === 12 ? currentYear + 1 : currentYear}-${String(currentMonth === 12 ? 1 : currentMonth + 1).padStart(2, '0')}-01`,
        };
    }
  };

  const fetchCashFlow = async () => {
    try {
      const dates = getPeriodDates(period);
      
      // Log the date range and period for debugging
      console.log('Fetching cash flow for:', { period, dates });
      
      // 1. First, fetch regular cash flow entries
      const { data: cashFlowData, error: cashFlowError } = await supabase
        .from('cash_flow')
        .select('*')
        .gte('date', dates.start)
        .lt('date', dates.end)
        .order('date', { ascending: true });

      if (cashFlowError) throw cashFlowError;

      // 2. Now fetch payments that are marked as paid but don't have entries in cash_flow
      const { data: paidPaymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          id,
          description,
          amount,
          payment_date,
          status
        `)
        .eq('status', 'paid')
        .gte('payment_date', dates.start)
        .lt('payment_date', dates.end);

      if (paymentsError) throw paymentsError;

      // Log raw data for debugging
      console.log('Cash flow data from database:', cashFlowData);
      console.log('Paid payments not in cash flow:', paidPaymentsData);
      
      // 3. Create a set of existing payment_ids in cash_flow for quick lookup
      const existingPaymentIds = new Set(
        (cashFlowData || [])
          .filter(item => item.payment_id)
          .map(item => item.payment_id)
      );
      
      console.log('Existing payment IDs in cash flow:', Array.from(existingPaymentIds));
      
      // 4. For each paid payment, check if it already has a cash flow entry
      const newCashFlowEntries = [];
      for (const payment of paidPaymentsData || []) {
        if (payment.status === 'paid' && payment.payment_date && !existingPaymentIds.has(payment.id)) {
          console.log(`Creating cash flow entry for payment ${payment.id} (${payment.description})`);
          
          // Create a new cash flow entry object
          const newEntry = {
            type: 'income',
            description: payment.description,
            amount: payment.amount,
            date: payment.payment_date,
            category: 'payment',
            payment_id: payment.id
          };
          
          newCashFlowEntries.push(newEntry);
          
          // Also add to the existing payment IDs set to avoid duplicates
          existingPaymentIds.add(payment.id);
        }
      }
      
      // 5. If there are new entries to add, insert them into the database
      if (newCashFlowEntries.length > 0) {
        console.log(`Inserting ${newCashFlowEntries.length} new cash flow entries:`, newCashFlowEntries);
        
        const { error: insertError } = await supabase
          .from('cash_flow')
          .insert(newCashFlowEntries);
          
        if (insertError) {
          console.error('Error creating cash flow entries for payments:', insertError);
          toast({
            title: "Erro ao sincronizar pagamentos",
            description: "Alguns pagamentos não puderam ser sincronizados com o fluxo de caixa.",
            variant: "destructive",
          });
        } else {
          console.log('Successfully added new cash flow entries');
          toast({
            title: "Fluxo de caixa atualizado",
            description: `${newCashFlowEntries.length} novos pagamentos sincronizados.`,
          });
        }
      }

      // Fetch cash flow data again to include newly created entries
      const { data: updatedCashFlowData, error: updateFetchError } = await supabase
        .from('cash_flow')
        .select('*')
        .gte('date', dates.start)
        .lt('date', dates.end)
        .order('date', { ascending: true });

      if (updateFetchError) throw updateFetchError;

      // Transform the data for accurate number handling
      const transformedData: CashFlow[] = (updatedCashFlowData || []).map(item => {
        // Handle amount with care to ensure it's a proper number
        let amount: number;
        
        // First ensure that the item.amount exists
        if (item.amount === null || item.amount === undefined) {
          // Default to 0 if amount is null or undefined
          amount = 0;
        } else if (typeof item.amount === 'string') {
          // If it's a string, replace comma with dot and parse
          const amountStr = String(item.amount).replace(',', '.');
          amount = parseFloat(amountStr);
        } else if (typeof item.amount === 'number') {
          // If it's already a number, use it directly
          amount = item.amount;
        } else {
          // For any other type, default to 0
          console.warn('Unexpected amount type:', typeof item.amount, item.amount);
          amount = 0;
        }
        
        // Ensure we have at most 2 decimal places to avoid floating point errors
        amount = parseFloat(amount.toFixed(2));
        
        return {
          ...item,
          type: validateCashFlowType(item.type),
          id: item.id,
          description: item.description,
          amount: amount,
          date: item.date,
          category: item.category,
          payment_id: item.payment_id || undefined,
          created_at: item.created_at || undefined,
          updated_at: item.updated_at || undefined
        };
      });

      // Extra validation step to ensure all amounts are valid numbers
      const validatedData = transformedData.map(item => ({
        ...item,
        amount: isNaN(item.amount) ? 0 : parseFloat(item.amount.toFixed(2))
      }));

      setCashFlow(validatedData);

      // Process data for the chart with precise number handling
      const chartDataMap = new Map();
      
      validatedData.forEach((flow) => {
        const dateObj = new Date(flow.date);
        const date = dateObj.toLocaleDateString('pt-BR');
        
        const currentData = chartDataMap.get(date) || {
          name: date,
          entrada: 0,
          saida: 0,
          saldo: 0,
        };

        if (flow.type === 'income') {
          currentData.entrada = parseFloat((currentData.entrada + flow.amount).toFixed(2));
        } else {
          currentData.saida = parseFloat((currentData.saida + flow.amount).toFixed(2));
        }

        currentData.saldo = parseFloat((currentData.entrada - currentData.saida).toFixed(2));
        chartDataMap.set(date, currentData);
      });

      // Convert Map to Array and sort by date
      const newChartData = Array.from(chartDataMap.values());
      
      // Sort by date (DD/MM/YYYY format needs special handling)
      newChartData.sort((a, b) => {
        const [dayA, monthA, yearA] = a.name.split('/').map(Number);
        const [dayB, monthB, yearB] = b.name.split('/').map(Number);
        
        // Compare year first, then month, then day
        if (yearA !== yearB) return yearA - yearB;
        if (monthA !== monthB) return monthA - monthB;
        return dayA - dayB;
      });
      
      console.log('Processed chart data sample:', newChartData.slice(0, 3));
      setChartData(newChartData);

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
