
import { motion } from "framer-motion";
import { CashFlow } from "@/components/CashFlow";
import { Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const stats = [
  { title: "Receita Total", value: "R$ 24.500", change: "+12.5%", description: "Mês atual" },
  { title: "Despesas Totais", value: "R$ 18.200", change: "+5.2%", description: "Mês atual" },
  { title: "Lucro Líquido", value: "R$ 6.300", change: "+7.3%", description: "Mês atual" },
  { title: "Clientes Ativos", value: "45", change: "+5", description: "Últimos 30 dias" },
];

export const Overview = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Visão Geral</h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
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
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                  <span className={`text-sm ${
                    stat.change.startsWith('+') 
                      ? 'text-green-500' 
                      : stat.change === '0%' 
                      ? 'text-gray-500' 
                      : 'text-red-500'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{stat.description}</p>
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
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
            </CardHeader>
            <CardContent>
              <CashFlow showChart={true} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <CashFlow showChart={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

