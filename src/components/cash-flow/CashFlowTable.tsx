
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { NewCashFlowForm } from "./NewCashFlowForm";
import { ImportCashFlow } from "./ImportCashFlow";
import { EditableCell } from "@/components/EditableCell";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { CashFlow } from "@/types/cashflow";

interface CashFlowTableProps {
  cashFlow: CashFlow[];
  onNewCashFlow: () => void;
}

export const CashFlowTable = ({
  cashFlow,
  onNewCashFlow
}: CashFlowTableProps) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Format date to YYYY-MM-DD for input editing
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Format amount for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Handle cell updates
  const handleUpdateCashFlow = async (id: string, field: string, value: string) => {
    setIsUpdating(true);

    try {
      // Convert amount to number if that's the field being updated
      const updateData = field === 'amount' 
        ? { [field]: parseFloat(value) } 
        : { [field]: value };

      const { error } = await supabase
        .from('cash_flow')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Atualizado com sucesso",
        description: "A movimentação foi atualizada.",
      });
      
      // Refresh data to show updated values
      onNewCashFlow();
    } catch (error) {
      console.error('Error updating cash flow:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a movimentação.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Map cash flow type to display text
  const getTypeText = (type: string) => {
    return type === 'income' ? 'Entrada' : 'Saída';
  };

  // Update cash flow type
  const handleTypeChange = async (id: string, currentType: string) => {
    const newType = currentType === 'income' ? 'expense' : 'income';
    await handleUpdateCashFlow(id, 'type', newType);
  };

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
                    <EditableCell
                      value={formatDateForInput(flow.date)}
                      onChange={(value) => handleUpdateCashFlow(flow.id, 'date', value)}
                      type="date"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <EditableCell
                      value={getTypeText(flow.type)}
                      onChange={() => handleTypeChange(flow.id, flow.type)}
                    />
                  </td>
                  <td className="py-2 px-4 capitalize">
                    <EditableCell
                      value={flow.category}
                      onChange={(value) => handleUpdateCashFlow(flow.id, 'category', value)}
                    />
                  </td>
                  <td className="py-2 px-4">
                    <EditableCell
                      value={flow.description}
                      onChange={(value) => handleUpdateCashFlow(flow.id, 'description', value)}
                    />
                  </td>
                  <td className="py-2 px-4 text-right">
                    <EditableCell
                      value={flow.amount.toString()}
                      onChange={(value) => handleUpdateCashFlow(flow.id, 'amount', value)}
                      type="number"
                      className="text-right"
                    />
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
