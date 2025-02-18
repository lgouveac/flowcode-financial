
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface RecurringBill {
  id: string;
  clientName: string;
  value: number;
  frequency: string;
  nextDue: string;
  status: "active" | "overdue" | "cancelled";
}

const mockBills: RecurringBill[] = [
  {
    id: "1",
    clientName: "Tech Solutions Ltd",
    value: 1500.00,
    frequency: "Mensal",
    nextDue: "15/04/2024",
    status: "active",
  },
  {
    id: "2",
    clientName: "Digital Marketing Co",
    value: 2800.00,
    frequency: "Mensal",
    nextDue: "20/04/2024",
    status: "overdue",
  },
];

export const RecurringBilling = () => {
  const { toast } = useToast();
  const [openRecurring, setOpenRecurring] = useState(false);
  const [openManual, setOpenManual] = useState(false);

  const handleNewBilling = (type: 'recurring' | 'manual') => {
    toast({
      title: `Nova Cobrança ${type === 'recurring' ? 'Recorrente' : 'Manual'}`,
      description: "Cobrança criada com sucesso.",
    });
    type === 'recurring' ? setOpenRecurring(false) : setOpenManual(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-display">Cobranças Recorrentes</CardTitle>
          <Dialog open={openRecurring} onOpenChange={setOpenRecurring}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Nova Cobrança Recorrente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Nova Cobrança Recorrente</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="client-recurring">Cliente</Label>
                  <Select>
                    <SelectTrigger id="client-recurring" className="w-full">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="client1">Tech Solutions Ltd</SelectItem>
                      <SelectItem value="client2">Digital Marketing Co</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value-recurring">Valor</Label>
                  <Input id="value-recurring" type="number" placeholder="0,00" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="frequency">Frequência</Label>
                  <Select>
                    <SelectTrigger id="frequency" className="w-full">
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="start-date">Data de Início</Label>
                  <Input id="start-date" type="date" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleNewBilling('recurring')}>Criar Cobrança</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Valor</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Frequência</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Próximo Vencimento</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockBills.map((bill) => (
                  <tr key={bill.id} className="border-t hover:bg-muted/50">
                    <td className="p-4">{bill.clientName}</td>
                    <td className="p-4">R$ {bill.value.toFixed(2)}</td>
                    <td className="p-4">{bill.frequency}</td>
                    <td className="p-4">{bill.nextDue}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bill.status === "active" 
                          ? "bg-green-100 text-green-800" 
                          : bill.status === "overdue"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {bill.status === "active" ? "Ativo" : bill.status === "overdue" ? "Atrasado" : "Cancelado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-display">Cobranças Manuais</CardTitle>
          <Dialog open={openManual} onOpenChange={setOpenManual}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Nova Cobrança Manual
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Nova Cobrança Manual</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="client-manual">Cliente</Label>
                  <Select>
                    <SelectTrigger id="client-manual" className="w-full">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="client1">Tech Solutions Ltd</SelectItem>
                      <SelectItem value="client2">Digital Marketing Co</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value-manual">Valor</Label>
                  <Input id="value-manual" type="number" placeholder="0,00" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="due-date">Data de Vencimento</Label>
                  <Input id="due-date" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input id="description" placeholder="Descrição da cobrança" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleNewBilling('manual')}>Criar Cobrança</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Valor</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Vencimento</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Descrição</th>
                  <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t hover:bg-muted/50">
                  <td className="p-4">Tech Solutions Ltd</td>
                  <td className="p-4">R$ 3.500,00</td>
                  <td className="p-4">25/03/2024</td>
                  <td className="p-4">Consultoria Extra</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pendente
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
