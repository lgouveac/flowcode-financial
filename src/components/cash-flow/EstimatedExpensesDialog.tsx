
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { EstimatedExpense } from "@/types/employee";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface EstimatedExpensesDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EstimatedExpensesDialog = ({ open, onClose, onSuccess }: EstimatedExpensesDialogProps) => {
  const [expenses, setExpenses] = useState<EstimatedExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newExpense, setNewExpense] = useState<EstimatedExpense>({
    name: "",
    amount: 0,
    category: "fixed",
    is_recurring: true,
    start_date: format(new Date(), 'yyyy-MM-dd'),
  });
  
  const { toast } = useToast();

  // Fetch expenses
  useEffect(() => {
    if (open) {
      fetchExpenses();
    }
  }, [open]);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('estimated_expenses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching estimated expenses:", error);
      toast({
        title: "Erro ao carregar despesas",
        description: "Não foi possível carregar as despesas estimadas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.name || !newExpense.amount) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e valor são campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('estimated_expenses')
        .insert([newExpense])
        .select();
      
      if (error) throw error;
      
      setExpenses([...(data || []), ...expenses]);
      setNewExpense({
        name: "",
        amount: 0,
        category: "fixed",
        is_recurring: true,
        start_date: format(new Date(), 'yyyy-MM-dd'),
      });
      
      toast({
        title: "Despesa adicionada",
        description: "A despesa estimada foi adicionada com sucesso.",
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error adding estimated expense:", error);
      toast({
        title: "Erro ao adicionar despesa",
        description: "Não foi possível adicionar a despesa estimada.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('estimated_expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setExpenses(expenses.filter(expense => expense.id !== id));
      toast({
        title: "Despesa removida",
        description: "A despesa estimada foi removida com sucesso.",
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error deleting estimated expense:", error);
      toast({
        title: "Erro ao remover despesa",
        description: "Não foi possível remover a despesa estimada.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Despesas Estimadas</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add new expense form */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-medium">Adicionar Nova Despesa</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-name">Nome da despesa</Label>
                <Input 
                  id="expense-name" 
                  value={newExpense.name} 
                  onChange={(e) => setNewExpense({...newExpense, name: e.target.value})}
                  placeholder="Ex: Aluguel, Internet, etc"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-amount">Valor</Label>
                <Input 
                  id="expense-amount" 
                  type="number" 
                  value={newExpense.amount} 
                  onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-category">Categoria</Label>
                <Input 
                  id="expense-category" 
                  value={newExpense.category} 
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  placeholder="Ex: Escritório, TI, etc"
                />
              </div>
              <div className="flex items-end space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="is-recurring" 
                    checked={newExpense.is_recurring} 
                    onCheckedChange={(checked) => 
                      setNewExpense({...newExpense, is_recurring: checked === true})
                    }
                  />
                  <Label htmlFor="is-recurring">Despesa recorrente</Label>
                </div>
              </div>
              {newExpense.is_recurring && (
                <>
                  <div className="space-y-2">
                    <Label>Data de início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newExpense.start_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newExpense.start_date ? format(new Date(newExpense.start_date), 'dd/MM/yyyy') : "Selecione uma data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newExpense.start_date ? new Date(newExpense.start_date) : undefined}
                          onSelect={(date) => 
                            setNewExpense({
                              ...newExpense, 
                              start_date: date ? format(date, 'yyyy-MM-dd') : undefined
                            })
                          }
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Data de término (opcional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newExpense.end_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newExpense.end_date ? format(new Date(newExpense.end_date), 'dd/MM/yyyy') : "Selecione uma data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newExpense.end_date ? new Date(newExpense.end_date) : undefined}
                          onSelect={(date) => 
                            setNewExpense({
                              ...newExpense, 
                              end_date: date ? format(date, 'yyyy-MM-dd') : undefined
                            })
                          }
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
            </div>
            <Button className="mt-4" onClick={handleAddExpense}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Despesa
            </Button>
          </div>
          
          {/* Existing expenses list */}
          <div>
            <h3 className="text-lg font-medium mb-3">Despesas Cadastradas</h3>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma despesa estimada cadastrada
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left py-2 px-4">Nome</th>
                      <th className="text-left py-2 px-4">Categoria</th>
                      <th className="text-right py-2 px-4">Valor</th>
                      <th className="text-center py-2 px-4">Recorrente</th>
                      <th className="text-center py-2 px-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="border-t">
                        <td className="py-2 px-4">{expense.name}</td>
                        <td className="py-2 px-4">{expense.category}</td>
                        <td className="py-2 px-4 text-right">{formatCurrency(expense.amount)}</td>
                        <td className="py-2 px-4 text-center">
                          {expense.is_recurring ? "Sim" : "Não"}
                        </td>
                        <td className="py-2 px-4 text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => expense.id && handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
