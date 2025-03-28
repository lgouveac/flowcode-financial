import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMetrics } from "@/hooks/useMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CircleDollarSign, LineChart, Wallet, CircleArrowUp, CircleArrowDown, UserIcon, CoinsIcon } from "lucide-react";

export const Overview = () => {
  const [period, setPeriod] = useState("current");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const {
    metrics,
    isLoading
  } = useMetrics(period);

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

  // Main stats
  const stats = [{
    title: "Receita Total",
    value: formatCurrency(metrics.totalRevenue || 0),
    change: metrics.revenueChange || "0%",
    description: period === "current" ? "Mês atual" : "Período selecionado",
    icon: <CircleDollarSign className="h-4 w-4 text-green-500" />
  }, {
    title: "Faturamento Esperado",
    value: formatCurrency(metrics.expectedRevenue || 0),
    change: metrics.expectedRevenueChange || "0%",
    description: "Recebimentos pendentes",
    icon: <LineChart className="h-4 w-4 text-blue-500" />
  }, {
    title: "Despesas Totais",
    value: formatCurrency(metrics.totalExpenses || 0),
    change: metrics.expensesChange || "0%",
    description: period === "current" ? "Mês atual" : "Período selecionado",
    icon: <CircleArrowDown className="h-4 w-4 text-red-500" />
  }, {
    title: "Lucro Líquido",
    value: formatCurrency(metrics.netProfit || 0),
    change: metrics.profitChange || "0%",
    description: period === "current" ? "Mês atual" : "Período selecionado",
    icon: <CircleArrowUp className="h-4 w-4 text-green-500" />
  }, {
    title: "Clientes Ativos",
    value: (metrics.activeClients || 0).toString(),
    change: metrics.clientsChange || "0",
    description: "Últimos 30 dias",
    icon: <UserIcon className="h-4 w-4 text-blue-500" />
  }];

  // Category-specific financial stats
  const categoryStats = [{
    title: "Investimentos",
    value: formatCurrency(metrics.investmentExpenses || 0),
    change: metrics.investmentChange || "0%",
    description: "CDBs e outros investimentos",
    category: "investment",
    icon: <Wallet className="h-4 w-4 text-purple-500" />
  }, {
    title: "Pro Labore",
    value: formatCurrency(metrics.proLaboreExpenses || 0),
    change: metrics.proLaboreChange || "0%",
    description: "Pagamentos aos sócios",
    category: "pro_labore",
    icon: <UserIcon className="h-4 w-4 text-indigo-500" />
  }, {
    title: "Distribuição de Lucros",
    value: formatCurrency(metrics.profitDistributionExpenses || 0),
    change: metrics.profitDistributionChange || "0%",
    description: "Retiradas e lucros distribuídos",
    category: "profit_distribution",
    icon: <CoinsIcon className="h-4 w-4 text-yellow-600" />
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
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              <SelectItem value="investment">Investimentos</SelectItem>
              <SelectItem value="pro_labore">Pro Labore</SelectItem>
              <SelectItem value="profit_distribution">Distribuição de Lucros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat, i) => <motion.div key={stat.title} initial={{
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
                {stat.icon}
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
                    {stat.icon}
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
                  
                  <p className="font-medium">Investimentos:</p>
                  <p>- {formatCurrency(metrics.investmentExpenses || 0)}</p>
                  
                  <p className="font-medium">Distribuição de Lucros:</p>
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
    </div>;
};
