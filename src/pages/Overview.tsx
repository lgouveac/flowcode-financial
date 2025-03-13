
import { motion } from "framer-motion";
import { CashFlow } from "@/components/CashFlow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMetrics } from "@/hooks/useMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export const Overview = () => {
  const [period, setPeriod] = useState("current");
  const {
    metrics,
    isLoading
  } = useMetrics(period);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Certificamos que todas as métricas terão valores zero se não existirem dados
  const stats = [{
    title: "Receita Total",
    value: formatCurrency(metrics.totalRevenue || 0),
    change: metrics.revenueChange || "0%",
    description: period === "current" ? "Mês atual" : "Período selecionado"
  }, {
    title: "Faturamento Esperado",
    value: formatCurrency(metrics.expectedRevenue || 0),
    change: metrics.expectedRevenueChange || "0%",
    description: "Recebimentos pendentes"
  }, {
    title: "Despesas Totais",
    value: formatCurrency(metrics.totalExpenses || 0),
    change: metrics.expensesChange || "0%",
    description: period === "current" ? "Mês atual" : "Período selecionado"
  }, {
    title: "Lucro Líquido",
    value: formatCurrency(metrics.netProfit || 0),
    change: metrics.profitChange || "0%",
    description: period === "current" ? "Mês atual" : "Período selecionado"
  }, {
    title: "Clientes Ativos",
    value: (metrics.activeClients || 0).toString(),
    change: metrics.clientsChange || "0",
    description: "Últimos 30 dias"
  }];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Visão Geral</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
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
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat, i) => (
          <motion.div key={stat.title} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
          >
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="detailed">Detalhado</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="border rounded-lg p-6">
          <CashFlow showChart={true} period={period} />
        </TabsContent>
        <TabsContent value="detailed" className="space-y-4">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Transações</h3>
            <CashFlow showChart={false} period={period} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
