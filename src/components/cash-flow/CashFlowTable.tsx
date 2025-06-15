import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { NewCashFlowForm } from "./NewCashFlowForm";
import { ImportCashFlow } from "./ImportCashFlow";
import { EditableCell } from "@/components/EditableCell";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { CashFlow } from "@/types/cashflow";
import { Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/types/cashflow-categories";
interface CashFlowTableProps {
  cashFlow: CashFlow[];
  onNewCashFlow: () => void;
}
export const CashFlowTable = ({
  cashFlow,
  onNewCashFlow
}: CashFlowTableProps) => {
  const {
    toast
  } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [filteredCashFlow, setFilteredCashFlow] = useState<CashFlow[]>(cashFlow);

  // Update filtered cash flow when original data or filters change
  useEffect(() => {
    let result = [...cashFlow];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(flow => flow.description.toLowerCase().includes(term) || flow.category.toLowerCase().includes(term));
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter(flow => flow.category === categoryFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      result = result.filter(flow => flow.type === typeFilter);
    }
    setFilteredCashFlow(result);
  }, [cashFlow, searchTerm, categoryFilter, typeFilter]);

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
      const updateData = field === 'amount' ? {
        [field]: parseFloat(value)
      } : {
        [field]: value
      };
      const {
        error
      } = await supabase.from('cash_flow').update(updateData).eq('id', id);
      if (error) throw error;
      toast({
        title: "Atualizado com sucesso",
        description: "A movimentação foi atualizada."
      });

      // Refresh data to show updated values
      onNewCashFlow();
    } catch (error) {
      console.error('Error updating cash flow:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a movimentação.",
        variant: "destructive"
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

  // Delete cash flow entry
  const handleDeleteCashFlow = async (id: string) => {
    try {
      const {
        error
      } = await supabase.from('cash_flow').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: "Excluído com sucesso",
        description: "A movimentação foi excluída."
      });

      // Refresh data to show updated list
      onNewCashFlow();
    } catch (error) {
      console.error('Error deleting cash flow:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a movimentação.",
        variant: "destructive"
      });
    }
  };

  // Prepare category options for the filter
  const allCategories = [...CATEGORIES.income, ...CATEGORIES.expense];
  const uniqueCategories = Array.from(new Set(allCategories.map(cat => cat.value))).map(value => {
    const category = allCategories.find(cat => cat.value === value);
    return category ? {
      value,
      label: category.label
    } : {
      value,
      label: value
    };
  });
  return <div className="relative z-10">
      <div className="flex items-center justify-between mb-6">
        
        <div className="flex gap-3">
          <ImportCashFlow onSuccess={onNewCashFlow} />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                Nova Movimentação
              </Button>
            </DialogTrigger>
            <NewCashFlowForm open={dialogOpen} onSuccess={onNewCashFlow} onClose={() => setDialogOpen(false)} />
          </Dialog>
        </div>
      </div>

      {/* Search and filter row */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Input placeholder="Pesquisar descrição ou categoria..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="income">Entradas</SelectItem>
            <SelectItem value="expense">Saídas</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {uniqueCategories.map(category => <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filteredCashFlow.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center bg-background/50">
          <div className="text-muted-foreground">
            {cashFlow.length === 0 ? "Nenhuma movimentação registrada" : "Nenhuma movimentação encontrada com os filtros aplicados"}
          </div>
        </div> : <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Data</th>
                <th className="text-left py-2 px-4">Tipo</th>
                <th className="text-left py-2 px-4">Categoria</th>
                <th className="text-left py-2 px-4">Descrição</th>
                <th className="text-right py-2 px-4">Valor</th>
                <th className="text-center py-2 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCashFlow.map(flow => <tr key={flow.id} className="border-b">
                  <td className="py-2 px-4">
                    <EditableCell value={formatDateForInput(flow.date)} onChange={value => handleUpdateCashFlow(flow.id, 'date', value)} type="date" />
                  </td>
                  <td className="py-2 px-4">
                    <EditableCell value={getTypeText(flow.type)} onChange={() => handleTypeChange(flow.id, flow.type)} />
                  </td>
                  <td className="py-2 px-4 capitalize">
                    <EditableCell value={flow.category} onChange={value => handleUpdateCashFlow(flow.id, 'category', value)} />
                  </td>
                  <td className="py-2 px-4">
                    <EditableCell value={flow.description} onChange={value => handleUpdateCashFlow(flow.id, 'description', value)} />
                  </td>
                  <td className="py-2 px-4 text-right">
                    <EditableCell value={flow.amount.toString()} onChange={value => handleUpdateCashFlow(flow.id, 'amount', value)} type="number" className="text-right" />
                  </td>
                  <td className="py-2 px-4 text-center">
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteCashFlow(flow.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>}
    </div>;
};