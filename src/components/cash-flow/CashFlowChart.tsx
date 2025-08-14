
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3 } from "lucide-react";
import { useEffect } from 'react';

interface CashFlowChartProps {
  chartData: any[];
  period: string;
  setPeriod: (value: string) => void;
  year: string;
  setYear: (value: string) => void;
  month: string;
  setMonth: (value: string) => void;
}

export const CashFlowChart = ({
  chartData,
  period,
  setPeriod,
  year,
  setYear,
  month,
  setMonth
}: CashFlowChartProps) => {
  // Log the chart data for debugging
  useEffect(() => {
    console.log('CashFlowChart chartData:', chartData);
  }, [chartData]);

  return (
    <Card className="shadow-none border-0">
      <CardHeader className="px-0">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-2xl font-display">Fluxo de Caixa</CardTitle>
          <p className="text-sm text-muted-foreground">Movimentação de entrada e saída do seu negócio</p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="mb-6 flex flex-wrap gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mensal</SelectItem>
              <SelectItem value="quarter">Trimestral</SelectItem>
              <SelectItem value="year">Anual</SelectItem>
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 3 }, (_, i) => {
                const yearValue = new Date().getFullYear() - i;
                return (
                  <SelectItem key={yearValue} value={yearValue.toString()}>
                    {yearValue}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {period === 'month' && (
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(2024, i).toLocaleDateString('pt-BR', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="h-[300px] w-full border border-border rounded-lg p-6">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="entrada" 
                  name="Entradas" 
                  stroke="#7C3AED" 
                  fillOpacity={1} 
                  fill="url(#colorEntrada)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="saida" 
                  name="Saídas" 
                  stroke="#EF4444" 
                  fillOpacity={1} 
                  fill="url(#colorSaida)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="saldo" 
                  name="Saldo" 
                  stroke="#3B82F6" 
                  fillOpacity={1} 
                  fill="url(#colorSaldo)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-medium text-muted-foreground mb-1">Sem dados disponíveis</h3>
              <p className="text-sm text-muted-foreground/70 text-center max-w-xs">
                Nenhuma movimentação encontrada para o período selecionado. Adicione transações para visualizar o gráfico.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
