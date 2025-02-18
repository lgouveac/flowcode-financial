
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

const stats = [
  { title: "Receita Total", value: "R$ 24.500", change: "+12.5%", description: "Mês atual" },
  { title: "Despesas Totais", value: "R$ 18.200", change: "+5.2%", description: "Mês atual" },
  { title: "Lucro Líquido", value: "R$ 6.300", change: "+7.3%", description: "Mês atual" },
  { title: "Clientes Ativos", value: "45", change: "+5", description: "Últimos 30 dias" },
  { title: "Faturas Pendentes", value: "12", change: "-3", description: "A vencer" },
  { title: "Ticket Médio", value: "R$ 2.850", change: "+15%", description: "Últimos 30 dias" },
  { title: "Impostos a Pagar", value: "R$ 3.420", change: "+2.1%", description: "Mês atual" },
  { title: "Folha de Pagamento", value: "R$ 12.500", change: "0%", description: "Mês atual" },
];

export const Overview = () => {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <Card key={stat.title} className="p-6 transition-shadow hover:shadow-card-hover">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
              <span className={`ml-2 text-sm ${stat.change.startsWith('+') ? 'text-green-500' : stat.change === '0%' ? 'text-gray-500' : 'text-red-500'}`}>
                {stat.change}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{stat.description}</p>
          </motion.div>
        </Card>
      ))}
    </div>
  );
};
