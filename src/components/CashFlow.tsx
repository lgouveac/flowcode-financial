
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CashFlowEntry {
  date: string;
  credit: number;
  debit: number;
  balance: number;
  type: 'faturamento' | 'funcionario' | 'imposto' | 'prolabore' | 'dividendos';
  description: string;
}

const mockData = [
  {
    name: 'Jan',
    entrada: 24500,
    saida: 18200,
    saldo: 6300,
  },
  {
    name: 'Fev',
    entrada: 28000,
    saida: 19500,
    saldo: 8500,
  },
  {
    name: 'Mar',
    entrada: 32000,
    saida: 21000,
    saldo: 11000,
  },
  // Adicione mais meses conforme necessário
];

export const CashFlow = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-display">Fluxo de Caixa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mockData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="entrada" name="Entradas" fill="#22c55e" />
              <Bar dataKey="saida" name="Saídas" fill="#ef4444" />
              <Bar dataKey="saldo" name="Saldo" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 rounded-md border">
          <table className="w-full">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="p-4 text-sm font-medium text-muted-foreground">Data</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Descrição</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Tipo</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Entrada</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Saída</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Saldo</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t hover:bg-muted/50">
                <td className="p-4">10/03/2024</td>
                <td className="p-4">Faturamento Cliente X</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Faturamento
                  </span>
                </td>
                <td className="p-4 text-green-600">R$ 5.000,00</td>
                <td className="p-4">-</td>
                <td className="p-4">R$ 5.000,00</td>
              </tr>
              <tr className="border-t hover:bg-muted/50">
                <td className="p-4">12/03/2024</td>
                <td className="p-4">Pagamento Funcionário Y</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Funcionário
                  </span>
                </td>
                <td className="p-4">-</td>
                <td className="p-4 text-red-600">R$ 3.500,00</td>
                <td className="p-4">R$ 1.500,00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
