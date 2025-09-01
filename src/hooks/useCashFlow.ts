
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CashFlow, validateCashFlowType } from "@/types/cashflow";
import { useToast } from "@/components/ui/use-toast";

export const useCashFlow = (period: string = 'current') => {
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const { toast } = useToast();
  
  // Concurrency control and state management
  const isSyncingRef = useRef(false);
  const syncedPaymentsRef = useRef(new Set<string>());
  const lastSyncTimeRef = useRef<number>(0);
  const SYNC_COOLDOWN = 30000; // 30 seconds cooldown between syncs

  const getPeriodDates = (selectedPeriod: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    console.log('Selected period:', selectedPeriod);

    if (selectedPeriod.includes('-')) {
      const parts = selectedPeriod.split('-');
      
      if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
        const year = Number(parts[0]);
        const month = Number(parts[1]);
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextMonthYear = month === 12 ? year + 1 : year;
        
        console.log(`Date range for ${year}-${month}: from ${year}-${String(month).padStart(2, '0')}-01 to ${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-01`);
        
        return {
          start: `${year}-${String(month).padStart(2, '0')}-01`,
          end: `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-01`,
        };
      }
      
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
      case 'all':
        // Return null to fetch all data without date filtering
        return null;
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
        console.log(`Unknown period format "${selectedPeriod}", defaulting to current month`);
        return {
          start: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
          end: `${currentMonth === 12 ? currentYear + 1 : currentYear}-${String(currentMonth === 12 ? 1 : currentMonth + 1).padStart(2, '0')}-01`,
        };
    }
  };

  const syncPaidPaymentsWithCashFlow = async () => {
    // Prevent concurrent sync operations
    if (isSyncingRef.current) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    // Check cooldown period
    const now = Date.now();
    if (now - lastSyncTimeRef.current < SYNC_COOLDOWN) {
      console.log('Sync cooldown active, skipping...');
      return;
    }

    try {
      isSyncingRef.current = true;
      lastSyncTimeRef.current = now;
      
      console.log('Starting sync of paid payments with cash flow...');
      
      // Get all paid payments that might need cash flow entries
      const { data: paidPayments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          id,
          description,
          amount,
          payment_date,
          status,
          clients!inner(name)
        `)
        .eq('status', 'paid')
        .not('payment_date', 'is', null);

      if (paymentsError) {
        console.error('Error fetching paid payments:', paymentsError);
        return;
      }

      console.log(`Found ${paidPayments?.length || 0} paid payments to check`);

      if (!paidPayments || paidPayments.length === 0) {
        console.log('No paid payments found, sync complete');
        return;
      }

      // Get all existing cash flow entries for these payments in one query
      const paymentIds = paidPayments.map(p => p.id);
      const { data: existingCashFlows, error: cashFlowError } = await supabase
        .from('cash_flow')
        .select('id, payment_id')
        .in('payment_id', paymentIds);

      if (cashFlowError) {
        console.error('Error fetching existing cash flows:', cashFlowError);
        return;
      }

      // Create a set of payment IDs that already have cash flow entries
      const existingPaymentIds = new Set(
        existingCashFlows?.map(cf => cf.payment_id) || []
      );

      // Find payments that need cash flow entries
      const paymentsNeedingCashFlow = paidPayments.filter(
        payment => !existingPaymentIds.has(payment.id) && !syncedPaymentsRef.current.has(payment.id)
      );

      console.log(`Found ${paymentsNeedingCashFlow.length} payments needing cash flow entries`);

      // Process payments that need cash flow entries
      const insertPromises = paymentsNeedingCashFlow.map(async (payment) => {
        try {
          // Use upsert with the unique constraint to prevent duplicates
          const { error: insertError } = await supabase
            .from('cash_flow')
            .upsert({
              type: 'income',
              description: payment.description,
              amount: payment.amount,
              date: payment.payment_date,
              category: 'payment',
              payment_id: payment.id
            }, {
              onConflict: 'payment_id'
            });

          if (insertError) {
            console.error(`Error creating cash flow entry for payment ${payment.id}:`, insertError);
            return { success: false, paymentId: payment.id, error: insertError };
          } else {
            console.log(`Successfully created cash flow entry for payment: ${payment.id} (${payment.description})`);
            syncedPaymentsRef.current.add(payment.id);
            return { success: true, paymentId: payment.id };
          }
        } catch (error) {
          console.error(`Exception creating cash flow for payment ${payment.id}:`, error);
          return { success: false, paymentId: payment.id, error };
        }
      });

      // Wait for all insertions to complete
      const results = await Promise.allSettled(insertPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

      console.log(`Sync complete: ${successful} successful, ${failed} failed`);

    } catch (error) {
      console.error('Critical error in syncPaidPaymentsWithCashFlow:', error);
    } finally {
      isSyncingRef.current = false;
    }
  };

  const fetchCashFlow = async (forcSync = false) => {
    try {
      // Temporarily disable sync to fix the search issue
      // if (forcSync || period === 'current' || period.includes(new Date().getFullYear().toString())) {
      //   await syncPaidPaymentsWithCashFlow();
      // }

      const dates = getPeriodDates(period);
      
      console.log('Fetching cash flow for:', { period, dates });
      
      let query = supabase
        .from('cash_flow')
        .select(`
          *,
          clients (
            id,
            name
          )
        `);
      
      // Apply date filters only if dates are provided (not for 'all' period)
      if (dates) {
        query = query
          .gte('date', dates.start)
          .lt('date', dates.end);
      }
      
      const { data: cashFlowData, error: cashFlowError } = await query
        .order('date', { ascending: true });

      if (cashFlowError) throw cashFlowError;

      console.log('Cash flow data from database:', cashFlowData);

      const transformedData: CashFlow[] = (cashFlowData || []).map(item => {
        let amount: number;
        
        if (item.amount === null || item.amount === undefined) {
          amount = 0;
        } else if (typeof item.amount === 'string') {
          const amountStr = String(item.amount).replace(',', '.');
          amount = parseFloat(amountStr);
        } else if (typeof item.amount === 'number') {
          amount = item.amount;
        } else {
          console.warn('Unexpected amount type:', typeof item.amount, item.amount);
          amount = 0;
        }
        
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
          client_id: item.client_id || undefined,
          clients: item.clients || undefined,
          created_at: item.created_at || undefined,
          updated_at: item.updated_at || undefined
        };
      });

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

      const newChartData = Array.from(chartDataMap.values());
      
      newChartData.sort((a, b) => {
        const [dayA, monthA, yearA] = a.name.split('/').map(Number);
        const [dayB, monthB, yearB] = b.name.split('/').map(Number);
        
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
