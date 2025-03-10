
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="border-b pb-6">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-2xl font-display">Fluxo de Caixa</CardTitle>
          <p className="text-sm text-muted-foreground">Movimentação de entrada e saída do seu negócio</p>
        </div>
      </CardHeader>
      <CardContent className="p-6">
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
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="entrada" name="Entradas" stroke="#7C3AED" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="saida" name="Saídas" stroke="#EF4444" />
              <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#3B82F6" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

