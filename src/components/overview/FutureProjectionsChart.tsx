
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface FutureProjection {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface FutureProjectionsChartProps {
  data: FutureProjection[];
  formatCurrency: (value: number) => string;
}

export const FutureProjectionsChart = ({ data, formatCurrency }: FutureProjectionsChartProps) => {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
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
  );
};
