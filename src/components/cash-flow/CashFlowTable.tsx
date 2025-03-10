
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { NewCashFlowForm } from "./NewCashFlowForm";
import { ImportCashFlow } from "./ImportCashFlow";
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
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Fluxo de Caixa</h2>
        <div className="flex gap-3">
          <ImportCashFlow onSuccess={onNewCashFlow} />
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                Nova Movimentação
              </Button>
            </DialogTrigger>
            <NewCashFlowForm 
              onSuccess={onNewCashFlow}
              onClose={() => {}}
            />
          </Dialog>
        </div>
      </div>

      {cashFlow.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-background/50">
          <div className="text-muted-foreground">
            Nenhuma movimentação registrada
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Data</th>
                <th className="text-left py-2 px-4">Tipo</th>
                <th className="text-left py-2 px-4">Categoria</th>
                <th className="text-left py-2 px-4">Descrição</th>
                <th className="text-right py-2 px-4">Valor</th>
              </tr>
            </thead>
            <tbody>
              {cashFlow.map((flow) => (
                <tr key={flow.id} className="border-b">
                  <td className="py-2 px-4">
                    {new Date(flow.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-2 px-4">
                    {flow.type === 'income' ? 'Entrada' : 'Saída'}
                  </td>
                  <td className="py-2 px-4 capitalize">
                    {flow.category}
                  </td>
                  <td className="py-2 px-4">
                    {flow.description}
                  </td>
                  <td className="py-2 px-4 text-right">
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
    </div>
  );
};
