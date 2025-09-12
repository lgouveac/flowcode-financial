import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMetrics } from "@/hooks/useMetrics";
import { useEstimatedExpenses, refetchEstimatedExpenses } from "@/hooks/useEstimatedExpenses";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { PaymentTable } from "@/components/payments/PaymentTable";
import { EstimatedExpensesDialog } from "@/components/cash-flow/EstimatedExpensesDialog";
import type { Payment } from "@/types/payment";
import { FileText, Calculator, BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TopClient {
  client_id: string;
  client_name: string;
  total_amount: number;
}

interface FutureProjection {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export const Overview = () => {
  const [period, setPeriod] = useState("current");
  const [futureProjections, setFutureProjections] = useState<FutureProjection[]>([]);
  const [projectionsLoading, setProjectionsLoading] = useState(false);
  const [projectionDialogOpen, setProjectionDialogOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [isCustomPeriod, setIsCustomPeriod] = useState(false);
  
  const {
    metrics,
    isLoading
  } = useMetrics(period, {
    customStartDate,
    customEndDate
  });
  
  const { estimatedExpenses, isLoading: isLoadingEstimates } = useEstimatedExpenses(period);
  
  const [pendingPaymentsOpen, setPendingPaymentsOpen] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [estimatedExpensesOpen, setEstimatedExpensesOpen] = useState(false);
  const [topClientsOpen, setTopClientsOpen] = useState(false);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [loadingTopClients, setLoadingTopClients] = useState(false);

  // Format currency with consistent decimal places
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Ensure accurate calculation by using proper number handling
  useEffect(() => {
    console.log('Overview metrics before display:', metrics);
  }, [metrics]);
  
  // Helper function to get period date ranges
  const getPeriodDates = (selectedPeriod: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    switch (selectedPeriod) {
      case 'current':
        return {
          start: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
          end: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0], // Last day of current month
        };
      case 'last_month':
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        return {
          start: `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`,
          end: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
        };
      case 'next_month':
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
        return {
          start: `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-01`,
          end: new Date(nextMonthYear, nextMonth, 0).toISOString().split('T')[0],
        };
      case 'last_3_months':
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return {
          start: threeMonthsAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        };
      case 'next_3_months':
        const threeMonthsFromNow = new Date(now);
        threeMonthsFromNow.setMonth(now.getMonth() + 3);
        return {
          start: now.toISOString().split('T')[0],
          end: threeMonthsFromNow.toISOString().split('T')[0],
        };
      case 'last_6_months':
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return {
          start: sixMonthsAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        };
      case 'next_6_months':
        const sixMonthsFromNow = new Date(now);
        sixMonthsFromNow.setMonth(now.getMonth() + 6);
        return {
          start: now.toISOString().split('T')[0],
          end: sixMonthsFromNow.toISOString().split('T')[0],
        };
      case 'last_year':
        const lastYear = new Date(now);
        lastYear.setFullYear(now.getFullYear() - 1);
        return {
          start: lastYear.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        };
      case 'next_year':
        const nextYear = new Date(now);
        nextYear.setFullYear(now.getFullYear() + 1);
        return {
          start: now.toISOString().split('T')[0],
          end: nextYear.toISOString().split('T')[0],
        };
      case 'current_year':
        return {
          start: `${currentYear}-01-01`,
          end: `${currentYear}-12-31`,
        };
      case 'previous_year':
        const previousYear = currentYear - 1;
        return {
          start: `${previousYear}-01-01`,
          end: `${previousYear}-12-31`,
        };
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: customStartDate.toISOString().split('T')[0],
            end: customEndDate.toISOString().split('T')[0],
          };
        }
        // Fallback to current month if custom dates not set
        return {
          start: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
          end: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
        };
      default:
        return {
          start: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
          end: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
        };
    }
  };

  // Handle period change
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    setIsCustomPeriod(newPeriod === 'custom');
  };

  // Get period label for display
  const getPeriodLabel = () => {
    switch (period) {
      case 'current': return 'Mês Atual';
      case 'last_month': return 'Mês Anterior';
      case 'next_month': return 'Próximo Mês';
      case 'last_3_months': return 'Últimos 3 Meses';
      case 'next_3_months': return 'Próximos 3 Meses';
      case 'last_6_months': return 'Últimos 6 Meses';
      case 'next_6_months': return 'Próximos 6 Meses';
      case 'last_year': return 'Último Ano';
      case 'next_year': return 'Próximo Ano';
      case 'current_year': return 'Ano Atual';
      case 'previous_year': return 'Ano Anterior';
      case 'custom': return customStartDate && customEndDate 
        ? `${format(customStartDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(customEndDate, 'dd/MM/yyyy', { locale: ptBR })}`
        : 'Período Personalizado';
      default: return 'Período selecionado';
    }
  };
  
  const fetchFutureProjections = async () => {
    setProjectionsLoading(true);
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Projection data for 12 months
      const projections: FutureProjection[] = [];
      
      // Get all existing payments (both one-time and installments) for the next 12 months
      const endDate = new Date(currentYear, currentMonth + 12, 0);
      const { data: allPaymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .gte('due_date', new Date().toISOString().split('T')[0])
        .lte('due_date', endDate.toISOString().split('T')[0])
        .in('status', ['pending', 'awaiting_invoice', 'billed', 'partially_paid', 'overdue']);
      
      if (paymentsError) throw paymentsError;
      
      // Get estimated monthly expenses
      const { data: estimatedExpensesData, error: expensesError } = await supabase
        .from('estimated_expenses')
        .select('*');
      
      if (expensesError) throw expensesError;
      
      // Calculate monthly totals for the next 12 months based on existing payments
      for (let i = 0; i < 12; i++) {
        const monthDate = new Date(currentYear, currentMonth + i, 1);
        const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth() + 1;
        
        // Calculate revenue from existing payments scheduled for this month
        const monthlyRevenue = (allPaymentsData || []).reduce((sum, payment) => {
          const dueDate = new Date(payment.due_date);
          const paymentYear = dueDate.getFullYear();
          const paymentMonth = dueDate.getMonth() + 1;
          
          if (paymentYear === year && paymentMonth === month) {
            // For partially paid payments, only count the remaining amount
            if (payment.status === 'partially_paid' && payment.paid_amount) {
              return sum + (Number(payment.amount) - Number(payment.paid_amount));
            }
            return sum + Number(payment.amount);
          }
          return sum;
        }, 0);
        
        // Calculate expenses from estimated expenses
        const monthlyExpenses = (estimatedExpensesData || []).reduce((sum, expense) => {
          return sum + Number(expense.amount);
        }, 0);
        
        // Calculate profit
        const profit = monthlyRevenue - monthlyExpenses;
        
        projections.push({
          month: monthName,
          revenue: parseFloat(monthlyRevenue.toFixed(2)),
          expenses: parseFloat(monthlyExpenses.toFixed(2)),
          profit: parseFloat(profit.toFixed(2))
        });
      }
      
      setFutureProjections(projections);
      
    } catch (error) {
      console.error("Error fetching future projections:", error);
    } finally {
      setProjectionsLoading(false);
    }
  };
  
  useEffect(() => {
    if (projectionDialogOpen) {
      fetchFutureProjections();
    }
  }, [projectionDialogOpen]);
  
  const fetchTopClients = async () => {
    setLoadingTopClients(true);
    
    try {
      // Get date range based on selected period
      const dates = getPeriodDates(period);
      
      // Define the type to match the correct Supabase response structure
      interface PaymentWithClient {
        amount: number;
        client_id: string;
        clients: {
          name: string;
        };
      }
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          amount,
          client_id,
          clients (
            name
          )
        `)
        .eq('status', 'paid')
        .gte('payment_date', dates.start)
        .lte('payment_date', dates.end);
      
      if (paymentsError) {
        throw paymentsError;
      }
      
      // Process data to get top clients
      const clientTotals: Record<string, { client_id: string; client_name: string; total_amount: number }> = {};
      
      // Use a more cautious approach to process the data with correct types
      if (paymentsData) {
        paymentsData.forEach((payment: any) => {
          const clientId = payment.client_id;
          // Access the name correctly - clients has the name directly
          const clientName = payment.clients?.name || 'Cliente';
          const amount = payment.amount || 0;
          
          if (clientTotals[clientId]) {
            clientTotals[clientId].total_amount += amount;
          } else {
            clientTotals[clientId] = {
              client_id: clientId,
              client_name: clientName,
              total_amount: amount
            };
          }
        });
      }
      
      // Convert to array and sort
      const sortedClients = Object.values(clientTotals).sort((a, b) => 
        b.total_amount - a.total_amount
      ).slice(0, 5);
      
      setTopClients(sortedClients);
      
      // Log data to help with debugging
      console.log('Top clients data:', sortedClients);
    } catch (error) {
      console.error("Error fetching top clients:", error);
    } finally {
      setLoadingTopClients(false);
    }
  };
  
  // Function to fetch pending payments - updated to apply same filtering as useMetrics
  const fetchPendingPayments = async () => {
    setLoadingPayments(true);
    
    try {
      // Get date range based on selected period
      const dates = getPeriodDates(period);
      
      // Fetch one-time payments first (now including overdue)
      const { data: oneTimePayments, error: oneTimeError } = await supabase
        .from('payments')
        .select(`
          *,
          clients (
            name,
            email,
            partner_name
          )
        `)
        .in('status', ['pending', 'awaiting_invoice', 'billed', 'partially_paid', 'overdue'])
        .gte('due_date', dates.start)
        .lte('due_date', dates.end)
        .order('due_date', { ascending: true });
      
      if (oneTimeError) {
        throw oneTimeError;
      }
      
      // Filter out payments with "recurring-" prefixed IDs to match useMetrics logic
      const filteredOneTimePayments = (oneTimePayments || []).filter(payment => 
        typeof payment.id === 'string' && !payment.id.startsWith('recurring-')
      );
      
      // Sort by due date
      filteredOneTimePayments.sort((a, b) => {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
      
      setPendingPayments(filteredOneTimePayments);
      
      // Log data to help with debugging
      console.log('Filtered pending payments (excluding recurring- prefixed IDs):', filteredOneTimePayments);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
    } finally {
      setLoadingPayments(false);
    }
  };
  
  // Handle click on the expected revenue card
  const handleExpectedRevenueClick = () => {
    fetchPendingPayments();
    setPendingPaymentsOpen(true);
  };

  // Handle click on the estimated expenses card
  const handleEstimatedExpensesClick = () => {
    setEstimatedExpensesOpen(true);
  };

  // Handle click on the top clients option
  const handleTopClientsClick = () => {
    fetchTopClients();
    setTopClientsOpen(true);
  };

  // Handle click on future projections
  const handleFutureProjectionsClick = () => {
    setProjectionDialogOpen(true);
  };

  // Calculate the total expected revenue (current revenue + expected future revenue)
  const totalExpectedRevenue = (metrics.totalRevenue || 0) + (metrics.expectedRevenue || 0);
  
  // Calculate percentage change for total expected revenue
  const totalExpectedRevenueChange = metrics.revenueChange || "0%";

  // Main stats
  const primaryStats = [{
    title: "Receita Total",
    value: formatCurrency(metrics.totalRevenue || 0),
    change: metrics.revenueChange || "0%",
    description: getPeriodLabel(),
  }, {
    title: "Despesas Totais",
    value: formatCurrency(metrics.totalExpenses || 0),
    change: metrics.expensesChange || "0%",
    description: getPeriodLabel(),
  }, {
    title: "Lucro Líquido",
    value: formatCurrency(metrics.netProfit || 0),
    change: metrics.profitChange || "0%",
    description: getPeriodLabel(),
  }, {
    title: "Clientes Ativos",
    value: (metrics.activeClients || 0).toString(),
    change: metrics.clientsChange || "0",
    description: "Últimos 30 dias",
  }];

  // Estimates section with updated descriptions to indicate exclusion of recurring billing
  const estimateStats = [{
    title: "Faturamento Esperado",
    value: formatCurrency(metrics.expectedRevenue || 0),
    change: metrics.expectedRevenueChange || "0%",
    description: "Recebimentos pontuais pendentes e atrasados",
    onClick: handleExpectedRevenueClick,
    icon: <FileText className="h-4 w-4 text-muted-foreground" />,
  }, {
    title: "Faturamento Total Esperado",
    value: formatCurrency(totalExpectedRevenue),
    change: totalExpectedRevenueChange,
    description: "Receita atual + pagamentos pontuais",
    icon: <FileText className="h-4 w-4 text-muted-foreground" />,
  }, {
    title: "Despesa Estimada",
    value: formatCurrency(estimatedExpenses.totalEstimatedExpenses || 0),
    change: estimatedExpenses.totalEstimatedExpensesChange || "0%",
    description: "Custos fixos estimados",
    onClick: handleEstimatedExpensesClick,
    icon: <Calculator className="h-4 w-4 text-muted-foreground" />,
  }];

  // Category-specific financial stats with updated names
  const categoryStats = [{
    title: "Investimento",
    value: formatCurrency(metrics.investmentExpenses || 0),
    change: metrics.investmentChange || "0%",
    description: "CDBs e outros investimentos",
    category: "investment",
  }, {
    title: "Pro Labore",
    value: formatCurrency(metrics.proLaboreExpenses || 0),
    change: metrics.proLaboreChange || "0%",
    description: "Pagamentos aos sócios",
    category: "pro_labore",
  }, {
    title: "Lucros",
    value: formatCurrency(metrics.profitDistributionExpenses || 0),
    change: metrics.profitDistributionChange || "0%",
    description: "Retiradas e lucros distribuídos",
    category: "profit_distribution",
  }];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Visão Geral</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Mês Atual</SelectItem>
              <SelectItem value="last_month">Mês Anterior</SelectItem>
              <SelectItem value="next_month">Próximo Mês</SelectItem>
              <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
              <SelectItem value="next_3_months">Próximos 3 Meses</SelectItem>
              <SelectItem value="last_6_months">Últimos 6 Meses</SelectItem>
              <SelectItem value="next_6_months">Próximos 6 Meses</SelectItem>
              <SelectItem value="last_year">Último Ano</SelectItem>
              <SelectItem value="next_year">Próximo Ano</SelectItem>
              <SelectItem value="current_year">Ano Atual</SelectItem>
              <SelectItem value="previous_year">Ano Anterior</SelectItem>
              <SelectItem value="custom">Período Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom Date Range Picker */}
          {isCustomPeriod && (
            <div className="flex flex-col sm:flex-row gap-2 relative z-10">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[140px] justify-start text-left font-normal",
                      !customStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate ? format(customStartDate, "dd/MM/yy", { locale: ptBR }) : "Data início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 bg-card border shadow-lg" 
                  align="start" 
                  side="bottom" 
                  sideOffset={5}
                  style={{ zIndex: 9999 }}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={(date) => {
                      console.log('Start date selected:', date);
                      setCustomStartDate(date);
                    }}
                    disabled={(date) => date < new Date("2020-01-01")}
                    locale={ptBR}
                    fixedWeeks
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[140px] justify-start text-left font-normal",
                      !customEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? format(customEndDate, "dd/MM/yy", { locale: ptBR }) : "Data fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 bg-card border shadow-lg" 
                  align="start" 
                  side="bottom" 
                  sideOffset={5}
                  style={{ zIndex: 9999 }}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={(date) => {
                      console.log('End date selected:', date);
                      setCustomEndDate(date);
                    }}
                    disabled={(date) => {
                      const isDisabled = date < new Date("2020-01-01") || 
                        (customStartDate && date < customStartDate);
                      return isDisabled;
                    }}
                    locale={ptBR}
                    fixedWeeks
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>


      {/* Primary stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {primaryStats.map((stat, i) => (
          <motion.div key={stat.title} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: i * 0.1
          }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-[100px]" />
                    <Skeleton className="h-4 w-[60px]" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                      <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-500' : stat.change === '0%' ? 'text-gray-500' : 'text-red-500'}`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{stat.description}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Estimates section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Estimativas</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {estimateStats.map((stat, i) => (
            <motion.div key={stat.title} initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: i * 0.1
            }}>
              <Card 
                className={stat.onClick ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}
                onClick={stat.onClick}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  {(isLoading || (stat.title === "Despesa Estimada" && isLoadingEstimates)) ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-[100px]" />
                      <Skeleton className="h-4 w-[60px]" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                        <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-500' : stat.change === '0%' ? 'text-gray-500' : 'text-red-500'}`}>
                          {stat.change}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{stat.description}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Financial Category Breakdown */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Detalhamento Financeiro por Categoria</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? 
            Array(3).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-[150px]" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-[100px]" />
                    <Skeleton className="h-4 w-[60px]" />
                  </div>
                </CardContent>
              </Card>
            )) : 
            categoryStats.map((stat, i) => (
              <motion.div key={stat.title} initial={{
                opacity: 0,
                y: 20
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                delay: i * 0.1
              }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                      <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-500' : stat.change === '0%' ? 'text-gray-500' : 'text-red-500'}`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{stat.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          }
        </div>
      </div>

      {/* Profit Analysis Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Análise de Lucratividade</h2>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <Alert variant="success" className="bg-green-50 dark:bg-green-950/20">
            <AlertTitle className="text-lg">Análise de Lucro Ajustado</AlertTitle>
            <AlertDescription>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <p className="font-medium">Receita Bruta:</p>
                  <p>{formatCurrency(metrics.totalRevenue || 0)}</p>
                  
                  <p className="font-medium">Despesas Operacionais:</p>
                  <p>- {formatCurrency(metrics.operationalExpenses || 0)}</p>
                  
                  <p className="font-medium">Pro Labore:</p>
                  <p>- {formatCurrency(metrics.proLaboreExpenses || 0)}</p>
                  
                  <p className="font-medium">Investimento:</p>
                  <p>- {formatCurrency(metrics.investmentExpenses || 0)}</p>
                  
                  <p className="font-medium">Lucros:</p>
                  <p>- {formatCurrency(metrics.profitDistributionExpenses || 0)}</p>
                  
                  <div className="col-span-2 border-t border-green-200 dark:border-green-800 my-2"></div>
                  
                  <p className="font-medium text-lg">Lucro Ajustado:</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-500">
                    {formatCurrency(metrics.adjustedProfit || 0)}
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {/* Pending Payments Modal */}
      <Dialog open={pendingPaymentsOpen} onOpenChange={setPendingPaymentsOpen}>
        <DialogContent className="w-full max-w-4xl">
          <DialogHeader>
            <DialogTitle>Recebimentos Pendentes - {getPeriodLabel()}</DialogTitle>
          </DialogHeader>
          
          {loadingPayments ? (
            <div className="flex justify-center py-8">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <PaymentTable 
              payments={pendingPayments} 
              onRefresh={fetchPendingPayments}
              templates={[]}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Estimated Expenses Modal */}
      <EstimatedExpensesDialog 
        open={estimatedExpensesOpen} 
        onClose={() => setEstimatedExpensesOpen(false)}
        onSuccess={() => {
          // Use the imported standalone function to refresh estimated expenses
          refetchEstimatedExpenses();
        }}
      />

      {/* Top Clients Modal */}
      <Dialog open={topClientsOpen} onOpenChange={setTopClientsOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Top Clientes - {getPeriodLabel()}</DialogTitle>
          </DialogHeader>
          
          {loadingTopClients ? (
            <div className="flex justify-center py-8">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="mt-4">
              {topClients.length > 0 ? (
                <div className="space-y-4">
                  {topClients.map((client, index) => (
                    <div key={client.client_id} className="flex justify-between items-center border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{index + 1}.</span>
                        <span className="font-medium">{client.client_name}</span>
                      </div>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(client.total_amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum cliente encontrado com pagamentos neste período.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Future Projections Modal */}
      <Dialog open={projectionDialogOpen} onOpenChange={setProjectionDialogOpen}>
        <DialogContent className="w-full max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Projeções Financeiras - Próximos 12 Meses</DialogTitle>
            <DialogDescription>
              Previsão de receitas, despesas e lucros para os próximos 12 meses.
            </DialogDescription>
          </DialogHeader>
          
          {projectionsLoading ? (
            <div className="flex justify-center py-8">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={futureProjections}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', { 
                          notation: 'compact',
                          compactDisplay: 'short',
                          currency: 'BRL'
                        }).format(value)
                      }
                    />
                    <Tooltip 
                      formatter={(value) => 
                        new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        }).format(Number(value))
                      } 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="Receita" stroke="#4ade80" strokeWidth={2} />
                    <Line type="monotone" dataKey="expenses" name="Despesas" stroke="#f43f5e" strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" name="Lucro" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left font-medium">Mês</th>
                        <th className="p-2 text-right font-medium">Receita</th>
                        <th className="p-2 text-right font-medium">Despesas</th>
                        <th className="p-2 text-right font-medium">Lucro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {futureProjections.map((projection) => (
                        <tr key={projection.month} className="border-b">
                          <td className="p-2 font-medium">{projection.month}</td>
                          <td className="p-2 text-right text-green-600 dark:text-green-400">
                            {formatCurrency(projection.revenue)}
                          </td>
                          <td className="p-2 text-right text-red-600 dark:text-red-400">
                            {formatCurrency(projection.expenses)}
                          </td>
                          <td className="p-2 text-right font-semibold">
                            {formatCurrency(projection.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
