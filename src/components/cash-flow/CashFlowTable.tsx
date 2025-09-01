import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { NewCashFlowForm } from "./NewCashFlowForm";
import { ImportCashFlow } from "./ImportCashFlow";
import { BulkClientSelector } from "./BulkClientSelector";
import { EditableCell } from "@/components/EditableCell";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { CashFlow } from "@/types/cashflow";
import { Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CATEGORIES } from "@/types/cashflow-categories";
interface CashFlowTableProps {
  cashFlow: CashFlow[];
  onNewCashFlow: () => void;
}
export const CashFlowTable = ({
  cashFlow,
  onNewCashFlow
}: CashFlowTableProps) => {
  console.log('CashFlowTable component rendered with cashFlow length:', cashFlow?.length);
  const {
    toast
  } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [filteredCashFlow, setFilteredCashFlow] = useState<CashFlow[]>(cashFlow);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);

  // Fetch clients for filter dropdown
  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error fetching clients:', error);
        return;
      }
      
      setClients(data || []);
    };

    fetchClients();
  }, []);

  // Update filtered cash flow when original data or filters change
  useEffect(() => {
    console.log('useEffect triggered with:', { searchTerm, categoryFilter, typeFilter, clientFilter });
    console.log('cashFlow data:', cashFlow);
    let result = [...cashFlow];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      console.log('Searching for term:', term);
      console.log('Total items before filter:', result.length);
      
      result = result.filter(flow => {
        const descMatch = flow.description.toLowerCase().includes(term);
        const catMatch = flow.category.toLowerCase().includes(term);
        const clientMatch = flow.clients?.name && flow.clients.name.toLowerCase().includes(term);
        
        if (descMatch || catMatch || clientMatch) {
          console.log('Match found:', {
            description: flow.description,
            category: flow.category,
            client: flow.clients?.name,
            descMatch,
            catMatch,
            clientMatch
          });
        }
        
        return descMatch || catMatch || clientMatch;
      });
      
      console.log('Items after filter:', result.length);
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter(flow => flow.category === categoryFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      result = result.filter(flow => flow.type === typeFilter);
    }

    // Apply client filter
    if (clientFilter === "no_client") {
      result = result.filter(flow => !flow.client_id);
    } else if (clientFilter !== "all") {
      result = result.filter(flow => flow.client_id === clientFilter);
    }

    setFilteredCashFlow(result);
    
    // Clear selections when filters change
    setSelectedIds([]);
  }, [cashFlow, searchTerm, categoryFilter, typeFilter, clientFilter]);

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

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredCashFlow.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleApplySuccess = () => {
    onNewCashFlow(); // Refresh data
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

  // Check if all filtered items are selected
  const isAllSelected = filteredCashFlow.length > 0 && selectedIds.length === filteredCashFlow.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < filteredCashFlow.length;
  
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
          <Input 
            placeholder="Pesquisar descrição ou categoria..." 
            value={searchTerm} 
            onChange={e => {
              console.log('Input changed to:', e.target.value);
              setSearchTerm(e.target.value);
            }} 
            className="pl-10" 
          />
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
        
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por cliente" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            <SelectItem value="all">Todos os clientes</SelectItem>
            <SelectItem value="no_client">Sem cliente</SelectItem>
            {clients.map(client => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Client Selector */}
      <BulkClientSelector 
        selectedIds={selectedIds}
        onClearSelection={handleClearSelection}
        onApplySuccess={handleApplySuccess}
      />

      {filteredCashFlow.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center bg-background/50">
          <div className="text-muted-foreground">
            {cashFlow.length === 0 ? "Nenhuma movimentação registrada" : "Nenhuma movimentação encontrada com os filtros aplicados"}
          </div>
        </div> : <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-center py-2 px-4 w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </th>
                <th className="text-left py-2 px-4">Data</th>
                <th className="text-left py-2 px-4">Tipo</th>
                <th className="text-left py-2 px-4">Categoria</th>
                <th className="text-left py-2 px-4">Descrição</th>
                <th className="text-left py-2 px-4">Cliente</th>
                <th className="text-right py-2 px-4">Valor</th>
                <th className="text-center py-2 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCashFlow.map(flow => <tr key={flow.id} className="border-b">
                  <td className="py-2 px-4 text-center">
                    <Checkbox
                      checked={selectedIds.includes(flow.id)}
                      onCheckedChange={(checked) => handleSelectItem(flow.id, checked as boolean)}
                      aria-label={`Selecionar ${flow.description}`}
                    />
                  </td>
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
                  <td className="py-2 px-4">
                    {flow.clients?.name ? (
                      <span className="text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        {flow.clients.name}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full border border-amber-200">
                        Sem cliente
                      </span>
                    )}
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