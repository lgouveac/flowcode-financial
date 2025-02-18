import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from "react";
import { PlusIcon } from "lucide-react";
interface CashFlowProps {
  showChart?: boolean;
}
interface CashFlowEntry {
  date: string;
  type: 'entrada' | 'saida';
  category: string;
  description: string;
  amount: number;
}
const CATEGORIES = {
  entrada: [{
    value: 'faturamento',
    label: 'Faturamento'
  }, {
    value: 'investimento',
    label: 'Investimento'
  }, {
    value: 'outros_entrada',
    label: 'Outros'
  }],
  saida: [{
    value: 'funcionario',
    label: 'Funcionário'
  }, {
    value: 'imposto',
    label: 'Imposto'
  }, {
    value: 'prolabore',
    label: 'Pró-labore'
  }, {
    value: 'dividendos',
    label: 'Dividendos'
  }, {
    value: 'fornecedor',
    label: 'Fornecedor'
  }, {
    value: 'outros_saida',
    label: 'Outros'
  }]
};
const mockData = [{
  name: 'Jan',
  entrada: 24500,
  saida: 18200,
  saldo: 6300
}, {
  name: 'Fev',
  entrada: 28000,
  saida: 19500,
  saldo: 8500
}, {
  name: 'Mar',
  entrada: 32000,
  saida: 21000,
  saldo: 11000
}];
export const CashFlow = ({
  showChart = true
}: CashFlowProps) => {
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você implementaria a lógica para salvar a movimentação
    console.log({
      type: movementType,
      category,
      description,
      amount: parseFloat(amount),
      date
    });
  };
  return <Card>
      <CardHeader>
        <CardTitle className="text-xl font-display">Fluxo de Caixa</CardTitle>
      </CardHeader>
      <CardContent>
        {showChart && <div className="h-[400px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData} margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5
          }}>
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
          </div>}

        <div className="mb-6 rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4">Nova Movimentação</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select onValueChange={(value: 'entrada' | 'saida') => setMovementType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES[movementType].map(cat => <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input type="number" step="0.01" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input placeholder="Descrição da movimentação" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">
              <PlusIcon className="h-4 w-4 mr-2" />
              Adicionar Movimentação
            </Button>
          </form>
        </div>

        <div className="rounded-md border">
          <table className="w-full">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="p-4 text-sm font-medium text-muted-foreground">Data</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Descrição</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Categoria</th>
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
    </Card>;
};