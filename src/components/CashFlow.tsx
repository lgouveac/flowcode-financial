import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from "react";
import { PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Movimentação Registrada",
      description: "A nova movimentação foi adicionada com sucesso.",
    });
    setOpenDialog(false);
    // Limpar campos
    setMovementType('entrada');
    setCategory('');
    setDescription('');
    setAmount('');
    setDate('');
  };

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl font-display tracking-tight">Fluxo de Caixa</CardTitle>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="font-medium">
                <PlusIcon className="h-4 w-4 mr-2" />
                Nova Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-display mb-4">Nova Movimentação</DialogTitle>
                <DialogDescription>
                  Preencha os dados abaixo para adicionar uma nova movimentação ao fluxo de caixa.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
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
        </CardHeader>
        <CardContent>
          {showChart && (
            <div className="h-[382px] w-full mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={mockData} 
                  margin={{ top: 25, right: 30, left: 20, bottom: 5 }}
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
          )}

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
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-muted/50">
                  <td className="p-4 text-sm">10/03/2024</td>
                  <td className="p-4 text-sm">Faturamento Cliente X</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Faturamento
                    </span>
                  </td>
                  <td className="p-4 text-sm text-green-600">R$ 5.000,00</td>
                  <td className="p-4 text-sm">-</td>
                  <td className="p-4 text-sm">R$ 5.000,00</td>
                </tr>
                <tr className="hover:bg-muted/50">
                  <td className="p-4 text-sm">12/03/2024</td>
                  <td className="p-4 text-sm">Pagamento Funcionário Y</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Funcionário
                    </span>
                  </td>
                  <td className="p-4 text-sm">-</td>
                  <td className="p-4 text-sm text-red-600">R$ 3.500,00</td>
                  <td className="p-4 text-sm">R$ 1.500,00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
