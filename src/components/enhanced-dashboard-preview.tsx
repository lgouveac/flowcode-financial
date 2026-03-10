import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard, 
  FileText, 
  AlertCircle,
  Calendar,
  Shield,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

const EnhancedDashboardPreview = () => {
  const [period, setPeriod] = useState("current_month");
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Sample financial data
  const financialData = [
    { month: "Jan 2024", revenue: 45000, expenses: 28000 },
    { month: "Fev 2024", revenue: 52000, expenses: 31000 },
    { month: "Mar 2024", revenue: 48000, expenses: 29000 },
    { month: "Abr 2024", revenue: 61000, expenses: 32000 },
  ];

  const totalRevenue = financialData.reduce((sum, d) => sum + d.revenue, 0);
  const totalExpenses = financialData.reduce((sum, d) => sum + d.expenses, 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Olá, bem vindo! 👋
              </h1>
              <p className="text-muted-foreground">
                Aqui está o resumo financeiro do seu negócio
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Mês Atual</SelectItem>
                  <SelectItem value="last_month">Mês Anterior</SelectItem>
                  <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
                  <SelectItem value="current_year">Ano Atual</SelectItem>
                </SelectContent>
              </Select>

              <Badge className="bg-green-100 text-green-800 border-green-200 gap-1 px-3 py-1.5">
                <Shield className="h-3 w-3" />
                Dados Seguros
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/50 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Receita Mensal
                </h3>
                <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(61000)}
                </p>
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium text-sm">12.5%</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">vs mês anterior</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Despesas Totais
                </h3>
                <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
                  <CreditCard className="h-6 w-6" />
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(32000)}
                </p>
                <div className="flex items-center gap-1">
                  <ArrowDownRight className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium text-sm">-8.2%</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">vs mês anterior</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Lucro Líquido
                </h3>
                <div className="p-3 rounded-xl bg-green-100 text-green-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(29000)}
                </p>
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium text-sm">+18.7%</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Margem: 47.5%</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Clientes Ativos
                </h3>
                <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-bold text-foreground">
                  24
                </p>
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium text-sm">+3</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">novos este mês</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <CardTitle>Fluxo Financeiro</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                Últimos 4 meses
              </Badge>
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Receita</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-lg font-semibold text-red-600">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Lucro</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(netProfit)}</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* Simplified Bar Chart */}
            <div className="space-y-3">
              {financialData.map((item, index) => {
                const maxValue = Math.max(...financialData.flatMap(d => [d.revenue, d.expenses]));
                const revenueHeight = (item.revenue / maxValue) * 100;
                const expensesHeight = (item.expenses / maxValue) * 100;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-green-600 font-medium">{formatCurrency(item.revenue)}</span>
                        <span className="text-red-600 font-medium">{formatCurrency(item.expenses)}</span>
                      </div>
                    </div>
                    
                    <div className="relative h-16 bg-gray-50 rounded-lg overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-green-200 rounded-lg transition-all duration-500"
                        style={{ width: `${revenueHeight}%` }}
                      >
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-green-600 rounded-full" />
                      </div>
                      <div 
                        className="absolute left-0 bottom-0 h-full bg-red-200 rounded-lg transition-all duration-500"
                        style={{ width: `${expensesHeight}%` }}
                      >
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-red-600 rounded-full" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded-full" />
                <span className="text-sm text-muted-foreground">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded-full" />
                <span className="text-sm text-muted-foreground">Despesas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-foreground">Ações Rápidas</h2>
            <Badge variant="outline" className="text-xs">
              4 pendências
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/50 hover:shadow-lg transition-all duration-200 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-orange-100 text-orange-600 border border-orange-200">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">Recebimentos Pendentes</h3>
                      <p className="text-sm text-muted-foreground mt-1">Faturas aguardando pagamento</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm font-medium px-2.5 py-1">
                    8
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">Atenção</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Faturas
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border/50 hover:shadow-lg transition-all duration-200 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-100 text-blue-600 border border-blue-200">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">Contratos a Vencer</h3>
                      <p className="text-sm text-muted-foreground mt-1">Renovações próximas</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm font-medium px-2.5 py-1">
                    3
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Informação</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Gerenciar
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border/50 hover:shadow-lg transition-all duration-200 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-green-100 text-green-600 border border-green-200">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">Próximos Vencimentos</h3>
                      <p className="text-sm text-muted-foreground mt-1">Pagamentos nos próximos 7 dias</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm font-medium px-2.5 py-1">
                    12
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Atualizado</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Agenda
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Transações Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { client: "Empresa ABC", amount: 12000, status: "Pago", date: "Hoje" },
                  { client: "Startup XYZ", amount: 8500, status: "Pendente", date: "Ontem" },
                  { client: "Comércio Local", amount: 6300, status: "Atrasado", date: "2 dias atrás" },
                ].map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{transaction.client}</p>
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatCurrency(transaction.amount)}</span>
                      <Badge 
                        variant="secondary"
                        className={cn(
                          transaction.status === 'Pago' && "bg-green-100 text-green-800 border-green-200",
                          transaction.status === 'Pendente' && "bg-orange-100 text-orange-800 border-orange-200",
                          transaction.status === 'Atrasado' && "bg-red-100 text-red-800 border-red-200"
                        )}
                      >
                        {transaction.status === 'Pago' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {transaction.status === 'Pendente' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {transaction.status === 'Atrasado' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" className="w-full mt-4">
                Ver Todas as Transações
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Insights Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ArrowUpRight className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Receita em Alta</p>
                        <p className="text-sm text-green-700">12.5% vs mês anterior</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-green-600">+R$7.650</span>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-800">Pagamentos Atrasados</p>
                        <p className="text-sm text-orange-700">Total: R$4.200</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                      Ação Necessária
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-800">Novos Clientes</p>
                        <p className="text-sm text-blue-700">Este mês</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-blue-600">+3</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboardPreview;