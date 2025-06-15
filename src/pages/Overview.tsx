
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMetrics } from "@/hooks/useMetrics";
import { useEstimatedExpenses, refetchEstimatedExpenses } from "@/hooks/useEstimatedExpenses";
import { EstimatedExpensesDialog } from "@/components/cash-flow/EstimatedExpensesDialog";
import { MetricsSection } from "@/components/overview/MetricsSection";
import { ProfitAnalysisSection } from "@/components/overview/ProfitAnalysisSection";
import { PendingPaymentsDialog } from "@/components/overview/dialogs/PendingPaymentsDialog";
import { TopClientsDialog } from "@/components/overview/dialogs/TopClientsDialog";
import { FutureProjectionsDialog } from "@/components/overview/dialogs/FutureProjectionsDialog";
import { useOverviewData } from "@/components/overview/hooks/useOverviewData";
import { formatCurrency } from "@/components/overview/utils/overviewUtils";
import { FileText, Calculator, BarChart3, Users, TrendingUp } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export const Overview = () => {
  const [period, setPeriod] = useState("current");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [pendingPaymentsOpen, setPendingPaymentsOpen] = useState(false);
  const [estimatedExpensesOpen, setEstimatedExpensesOpen] = useState(false);
  const [topClientsOpen, setTopClientsOpen] = useState(false);
  const [projectionDialogOpen, setProjectionDialogOpen] = useState(false);
  
  const { metrics, isLoading } = useMetrics(period);
  const { estimatedExpenses, isLoading: isLoadingEstimates } = useEstimatedExpenses(period);
  
  const {
    pendingPayments,
    topClients,
    futureProjections,
    loadingPayments,
    loadingTopClients,
    projectionsLoading,
    fetchPendingPayments,
    fetchTopClients,
    fetchFutureProjections
  } = useOverviewData(period);

  useEffect(() => {
    console.log('Overview metrics before display:', metrics);
  }, [metrics]);

  useEffect(() => {
    if (projectionDialogOpen) {
      fetchFutureProjections();
    }
  }, [projectionDialogOpen, fetchFutureProjections]);

  const handleExpectedRevenueClick = () => {
    fetchPendingPayments();
    setPendingPaymentsOpen(true);
  };

  const handleEstimatedExpensesClick = () => {
    setEstimatedExpensesOpen(true);
  };

  const handleTopClientsClick = () => {
    fetchTopClients();
    setTopClientsOpen(true);
  };

  const handleFutureProjectionsClick = () => {
    setProjectionDialogOpen(true);
  };

  const totalExpectedRevenue = (metrics.totalRevenue || 0) + (metrics.expectedRevenue || 0);
  const totalExpectedRevenueChange = metrics.revenueChange || "0%";

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

  const filteredCategoryStats = categoryFilter === "all" 
    ? categoryStats 
    : categoryStats.filter(stat => stat.category === categoryFilter);

  return (
    <div className="space-y-8">
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
              <DropdownMenuItem onClick={handleFutureProjectionsClick}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Projeções Futuras
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <MetricsSection 
        title="" 
        metrics={primaryStats} 
        isLoading={isLoading} 
      />

      <MetricsSection 
        title="Estimativas" 
        metrics={estimateStats} 
        isLoading={isLoading || isLoadingEstimates} 
        icon={<BarChart3 className="h-5 w-5 text-muted-foreground" />}
      />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Detalhamento Financeiro por Categoria</h2>
        <MetricsSection 
          title="" 
          metrics={filteredCategoryStats} 
          isLoading={isLoading} 
        />
      </div>

      <ProfitAnalysisSection 
        metrics={metrics} 
        isLoading={isLoading} 
        formatCurrency={formatCurrency} 
      />
      
      <PendingPaymentsDialog
        open={pendingPaymentsOpen}
        onOpenChange={setPendingPaymentsOpen}
        payments={pendingPayments}
        loading={loadingPayments}
        period={period}
        onRefresh={fetchPendingPayments}
      />

      <EstimatedExpensesDialog 
        open={estimatedExpensesOpen} 
        onClose={() => setEstimatedExpensesOpen(false)}
        onSuccess={() => {
          refetchEstimatedExpenses();
        }}
      />

      <TopClientsDialog
        open={topClientsOpen}
        onOpenChange={setTopClientsOpen}
        clients={topClients}
        loading={loadingTopClients}
        period={period}
        formatCurrency={formatCurrency}
      />

      <FutureProjectionsDialog
        open={projectionDialogOpen}
        onOpenChange={setProjectionDialogOpen}
        projections={futureProjections}
        loading={projectionsLoading}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};
