
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CATEGORIES } from "@/types/cashflow-categories";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface NewCashFlowFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const NewCashFlowForm = ({ onSuccess, onClose }: NewCashFlowFormProps) => {
  const { toast } = useToast();
  const [movementType, setMovementType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newCashFlow = {
      type: movementType,
      category,
      description,
      amount: Number(amount),
      date,
    };

    const { error } = await supabase
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

    onSuccess();
    onClose();
  };

  return (
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
  );
};

