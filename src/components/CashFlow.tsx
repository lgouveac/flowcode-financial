import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
}, {
  name: 'Abr',
  entrada: 30000,
  saida: 20000,
  saldo: 10000
}, {
  name: 'Mai',
  entrada: 35000,
  saida: 22000,
  saldo: 13000
}, {
  name: 'Jun',
  entrada: 33000,
  saida: 21500,
  saldo: 11500
}];

export const CashFlow = ({
  showChart = true
}: CashFlowProps) => {
  const { toast } = useToast();
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [period, setPeriod] = useState('month');
  const [year, setYear] = useState('2024');
  const [month, setMonth] = useState('3');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Movimentação Registrada",
      description: "A nova movimentação foi adicionada com sucesso.",
    });
    setOpenDialog(false);
    setMovementType('entrada');
    setCategory('');
    setDescription('');
    setAmount('');
    setDate('');
  };

  return (
    <div className="space-y-8 p-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
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
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
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
                  data={mockData}
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

        <Card className="shadow-sm">
          <CardHeader className="border-b pb-6">
            <div className="flex flex-col space-y-1.5">
              <CardTitle className="text-2xl font-display">Movimentações</CardTitle>
              <p className="text-sm text-muted-foreground">Acompanhe suas últimas movimentações</p>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex justify-end mb-6">
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-white hover:bg-primary-hover">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nova Movimentação
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Movimentação</DialogTitle>
                    <DialogDescription>
                      Adicione uma nova movimentação ao fluxo de caixa
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2.5">
                        <Label className="text-sm font-medium">Tipo</Label>
                        <Select value={movementType} onValueChange={(value: 'entrada' | 'saida') => setMovementType(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entrada">Entrada</SelectItem>
                            <SelectItem value="saida">Saída</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-sm font-medium">Categoria</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES[movementType].map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2.5">
                        <Label className="text-sm font-medium">Data</Label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-sm font-medium">Valor</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0,00" 
                          value={amount} 
                          onChange={e => setAmount(e.target.value)} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-sm font-medium">Descrição</Label>
                      <Input 
                        placeholder="Descrição da movimentação" 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                      />
                    </div>
                    <Button type="submit" className="w-full mt-6">
                      Adicionar Movimentação
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Data</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Descrição</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Valor</th>
                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/50">
                    <td className="py-3 px-4">10/03/2024</td>
                    <td className="py-3 px-4">Faturamento Cliente X</td>
                    <td className="py-3 px-4 text-green-600">R$ 5.000,00</td>
                    <td className="py-3 px-4">
                      <span className="status-badge status-badge-success">Entrada</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="py-3 px-4">12/03/2024</td>
                    <td className="py-3 px-4">Pagamento Funcionário Y</td>
                    <td className="py-3 px-4 text-red-600">R$ 3.500,00</td>
                    <td className="py-3 px-4">
                      <span className="status-badge status-badge-error">Saída</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
