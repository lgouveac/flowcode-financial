
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import { NewCashFlowForm } from "./NewCashFlowForm";
import type { CashFlow } from "@/types/cashflow";

interface CashFlowTableProps {
  cashFlow: CashFlow[];
  onNewCashFlow: () => void;
}

export const CashFlowTable = ({
  cashFlow,
  onNewCashFlow
}: CashFlowTableProps) => {
  return (
    <Card className="relative z-10 p-6 bg-background shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Fluxo de Caixa</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nova Movimentação
            </Button>
          </DialogTrigger>
          <NewCashFlowForm 
            onSuccess={onNewCashFlow}
            onClose={() => {}}
          />
        </Dialog>
      </div>

      {cashFlow.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-background">
          <div className="text-muted-foreground mb-4">
            Nenhuma movimentação registrada
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Adicionar Primeira Movimentação
              </Button>
            </DialogTrigger>
            <NewCashFlowForm 
              onSuccess={onNewCashFlow}
              onClose={() => {}}
            />
          </Dialog>
        </div>
      ) : (
        <div className="overflow-x-auto bg-background">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Data</th>
                <th className="text-left py-2">Tipo</th>
                <th className="text-left py-2">Categoria</th>
                <th className="text-left py-2">Descrição</th>
                <th className="text-right py-2">Valor</th>
              </tr>
            </thead>
            <tbody>
              {cashFlow.map((flow) => (
                <tr key={flow.id} className="border-b">
                  <td className="py-2">
                    {new Date(flow.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-2">
                    {flow.type === 'income' ? 'Entrada' : 'Saída'}
                  </td>
                  <td className="py-2 capitalize">
                    {flow.category}
                  </td>
                  <td className="py-2">
                    {flow.description}
                  </td>
                  <td className="py-2 text-right">
                    <span className={flow.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(flow.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
