
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/types/cashflow-categories";

interface FormFieldsProps {
  movementType: 'income' | 'expense';
  category: string;
  description: string;
  amount: string;
  date: string;
  onMovementTypeChange: (value: 'income' | 'expense') => void;
  onCategoryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onDateChange: (value: string) => void;
  isPaymentCategory: boolean;
}

export const FormFields = ({
  movementType,
  category,
  description,
  amount,
  date,
  onMovementTypeChange,
  onCategoryChange,
  onDescriptionChange,
  onAmountChange,
  onDateChange,
  isPaymentCategory,
}: FormFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2.5">
          <Label>Tipo</Label>
          <Select value={movementType} onValueChange={onMovementTypeChange}>
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
          <Label>Categoria</Label>
          <Select value={category} onValueChange={onCategoryChange}>
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
          <Label>Data</Label>
          <Input 
            type="date" 
            value={date} 
            onChange={e => onDateChange(e.target.value)} 
            required 
            className="bg-background"
          />
        </div>
        <div className="space-y-2.5">
          <Label>Valor</Label>
          <Input 
            type="number" 
            step="0.01" 
            placeholder="0,00" 
            value={amount} 
            onChange={e => onAmountChange(e.target.value)}
            required
            disabled={isPaymentCategory}
            className="bg-background" 
          />
        </div>
      </div>
      <div className="space-y-2.5">
        <Label>Descrição</Label>
        <Input 
          placeholder="Descrição da movimentação" 
          value={description} 
          onChange={e => onDescriptionChange(e.target.value)}
          required
          disabled={isPaymentCategory}
          className="bg-background"
        />
      </div>
    </>
  );
};
