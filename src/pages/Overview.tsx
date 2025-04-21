import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMetrics } from "@/hooks/useMetrics";
import { useEstimatedExpenses, refetchEstimatedExpenses } from "@/hooks/useEstimatedExpenses";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { PaymentTable } from "@/components/payments/PaymentTable";
import { EstimatedExpensesDialog } from "@/components/cash-flow/EstimatedExpensesDialog";
import type { Payment } from "@/types/payment";
import { FileText, Calculator, BarChart3, Users } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface TopClient {
  client_id: string;
  client_name: string;
  total_amount: number;
}

export const Overview = () => {
  const [period, setPeriod] = useState("current");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const {
    metrics,
    isLoading
  } = useMetrics(period);
  
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
      case 'last_3_months':
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return {
          start: threeMonthsAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        };
      case 'last_6_months':
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return {
          start: sixMonthsAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        };
      case 'last_year':
        const lastYear = new Date(now);
        lastYear.setFullYear(now.getFullYear() - 1);
        return {
          start: lastYear.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        };
      default:
        return {
          start: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
          end: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
        };
    }
  };
  
  // Updated function to fetch top clients with fixed type structure
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
  
  // Function to fetch pending payments
  const fetchPendingPayments = async () => {
    setLoadingPayments(true);
    
    try {
      // Get date range based on selected period
      const dates = getPeriodDates(period);
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          clients (
            name,
            email,
            partner_name
          )
        `)
        .in('status', ['pending', 'awaiting_invoice', 'billed', 'partially_paid'])
        .gte('due_date', dates.start)
        .lte('due_date', dates.end)
        .order('due_date', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setPendingPayments(data || []);
      
      // Log data to help with debugging
      console.log('Pending payments data:', data);
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

  // Calculate the total expected revenue (current revenue + expected future revenue)
  const totalExpectedRevenue = (metrics.totalRevenue || 0) + (metrics.expectedRevenue || 0);
  
  // Calculate percentage change for total expected revenue
  // This could be calculated against the previous period's total expected revenue if available
  const totalExpectedRevenueChange = metrics.revenueChange || "0%";

  // Main stats
  const primaryStats = [{
    title: "Receita Total",
    value: formatCurrency(metrics.totalRevenue || 0),
    change: metrics.revenueChange || "0%",
    description: period === "current" ? "Mês atual" : "Período selecionado",
  }, {
    title: "Despesas Totais",
    value: formatCurrency(metrics.totalExpenses || 0),
    change: metrics.expensesChange || "0%",
    description: period === "current" ? "Mês atual" : "Período selecionado",
  }, {
    title: "Lucro Líquido",
    value: formatCurrency(metrics.netProfit || 0),
    change: metrics.profitChange || "0%",
    description: period === "current" ? "Mês atual" : "Período selecionado",
  }, {
    title: "Clientes Ativos",
    value: (metrics.activeClients || 0).toString(),
    change: metrics.clientsChange || "0",
    description: "Últimos 30 dias",
  }];

  // Estimates section with new Total Expected Revenue card
  const estimateStats = [{
    title: "Faturamento Esperado",
    value: formatCurrency(metrics.expectedRevenue || 0),
    change: metrics.expectedRevenueChange || "0%",
    description: "Recebimentos pendentes",
    onClick: handleExpectedRevenueClick,
    icon: <FileText className="h-4 w-4 text-muted-foreground" />,
  }, {
    title: "Faturamento Total Esperado",
    value: formatCurrency(totalExpectedRevenue),
    change: totalExpectedRevenueChange,
    description: "Receita atual + pendente",
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

  // Filter the category stats based on selected filter
  const filteredCategoryStats = categoryFilter === "all" 
    ? categoryStats 
    : categoryStats.filter(stat => stat.category === categoryFilter);

  return <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-semibold">Visão Geral</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Mês Atual</SelectItem>
              <SelectItem value="last_month">Mês Anterior</SelectItem>
              <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
              <SelectItem value="last_6_months">Últimos 6 Meses</SelectItem>
              <SelectItem value="last_year">Último Ano</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center justify-between whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full sm:w-[180px]">
                {categoryFilter === "all" ? "Todas Categorias" : 
                 categoryFilter === "investment" ? "Investimento" :
                 categoryFilter === "pro_labore" ? "Pro Labore" :
                 categoryFilter === "profit_distribution" ? "Lucros" : 
                 "Filtrar"}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4 opacity-50"><path d="m6 9 6 6 6-6"></path></svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[180px]">
              <DropdownMenuItem onClick={() => setCategoryFilter("all")}>
                Todas Categorias
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter("investment")}>
                Investimento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter("pro_labore")}>
                Pro Labore
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter("profit_distribution")}>
                Lucros
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleTopClientsClick}>
                <Users className="mr-2 h-4 w-4" />
                Top Clientes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Primary stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {primaryStats.map((stat, i) => <motion.div key={stat.title} initial={{
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
                {isLoading ? <div className="space-y-2">
                    <Skeleton className="h-8 w-[100px]" />
                    <Skeleton className="h-4 w-[60px]" />
                  </div> : <>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                      <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-500' : stat.change === '0%' ? 'text-gray-500' : 'text-red-500'}`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{stat.description}</p>
                  </>}
              </CardContent>
            </Card>
          </motion.div>)}
      </div>

      {/* Estimates section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Estimativas</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {estimateStats.map((stat, i) => <motion.div key={stat.title} initial={{
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
                {(isLoading || (stat.title === "Despesa Estimada" && isLoadingEstimates)) ? <div className="space-y-2">
                    <Skeleton className="h-8 w-[100px]" />
                    <Skeleton className="h-4 w-[60px]" />
                  </div> : <>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                      <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-500' : stat.change === '0%' ? 'text-gray-500' : 'text-red-500'}`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{stat.description}</p>
                  </>}
              </CardContent>
            </Card>
          </motion.div>)}
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
            filteredCategoryStats.map((stat, i) => (
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
            <DialogTitle>Recebimentos Pendentes - {period === "current" ? "Mês Atual" : 
                          period === "last_month" ? "Mês Anterior" : 
                          period === "last_3_months" ? "Últimos 3 Meses" : 
                          period === "last_6_months" ? "Últimos 6 Meses" : 
                          "Último Ano"}</DialogTitle>
          </DialogHeader>
          
          {loadingPayments ? (
            <div className="flex justify-center py-8">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <PaymentTable 
              payments={pendingPayments} 
              onRefresh={fetchPendingPayments}
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
            <DialogTitle>Top Clientes - {period === "current" ? "Mês Atual" : 
                          period === "last_month" ? "Mês Anterior" : 
                          period === "last_3_months" ? "Últimos 3 Meses" : 
                          period === "last_6_months" ? "Últimos 6 Meses" : 
                          "Último Ano"}</DialogTitle>
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
    </div>;
};
