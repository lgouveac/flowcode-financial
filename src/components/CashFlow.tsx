
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PlusIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { CashFlow as CashFlowType } from "@/types/cashflow";

interface CashFlowProps {
  showChart?: boolean;
}

const CATEGORIES = {
  income: [{
    value: 'payment',
    label: 'Pagamento'
  }, {
    value: 'investment',
    label: 'Investimento'
  }, {
    value: 'other_income',
    label: 'Outros'
  }],
  expense: [{
    value: 'employee',
    label: 'Funcionário'
  }, {
    value: 'tax',
    label: 'Imposto'
  }, {
    value: 'pro_labore',
    label: 'Pró-labore'
  }, {
    value: 'dividend',
    label: 'Dividendos'
  }, {
    value: 'supplier',
    label: 'Fornecedor'
  }, {
    value: 'other_expense',
    label: 'Outros'
  }]
};

export const CashFlow = ({
  showChart = true
}: CashFlowProps) => {
  const { toast } = useToast();
  const [movementType, setMovementType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [period, setPeriod] = useState('month');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [cashFlow, setCashFlow] = useState<CashFlowType[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchCashFlow = async () => {
    const { data, error } = await supabase
      .from('cash_flow')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching cash flow:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o fluxo de caixa.",
        variant: "destructive",
      });
      return;
    }

    setCashFlow(data || []);
    processChartData(data || []);
  };

  const processChartData = (data: CashFlowType[]) => {
    const groupedData = data.reduce((acc: Record<string, { income: number; expense: number }>, item) => {
      const monthYear = new Date(item.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      if (!acc[monthYear]) {
        acc[monthYear] = { income: 0, expense: 0 };
      }

      if (item.type === 'income') {
        acc[monthYear].income += Number(item.amount);
      } else {
        acc[monthYear].expense += Number(item.amount);
      }

      return acc;
    }, {});

    const chartData = Object.entries(groupedData).map(([name, values]) => ({
      name,
      entrada: values.income,
      saida: values.expense,
      saldo: values.income - values.expense
    }));

    setChartData(chartData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newCashFlow = {
      type: movementType,
      category,
      description,
      amount: Number(amount),
      date,
    };

    const { data, error } = await supabase
      .from('cash_flow')
      .insert([newCashFlow])
      .select()
      .single();

    if (error) {
      console.error('Error creating cash flow:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a movimentação.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Movimentação registrada com sucesso.",
    });

    setOpenDialog(false);
    setMovementType('income');
    setCategory('');
    setDescription('');
    setAmount('');
    setDate('');
    fetchCashFlow();
  };

  useEffect(() => {
    fetchCashFlow();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_flow' },
        () => {
          fetchCashFlow();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
                  {Array.from({ length: 3 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
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
            
            {showChart && (
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
            )}
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
                        <Select value={movementType} onValueChange={(value: 'income' | 'expense') => setMovementType(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">Entrada</SelectItem>
                            <SelectItem value="expense">Saída</SelectItem>
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
                  {cashFlow.map((flow) => (
                    <tr key={flow.id} className="hover:bg-muted/50">
                      <td className="py-3 px-4">
                        {new Date(flow.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">{flow.description}</td>
                      <td className={`py-3 px-4 ${flow.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(flow.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          flow.type === 'income' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {flow.type === 'income' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
