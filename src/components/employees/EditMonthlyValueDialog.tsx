
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useEmployeeMonthlyValues } from "@/hooks/useEmployeeMonthlyValues";
import { EmployeeMonthlyValue } from "@/types/employee";

interface EditMonthlyValueDialogProps {
  monthlyValue: EmployeeMonthlyValue;
  open: boolean;
  onClose: () => void;
}

export const EditMonthlyValueDialog = ({ monthlyValue, open, onClose }: EditMonthlyValueDialogProps) => {
  const [amount, setAmount] = useState(String(monthlyValue.amount));
  const [notes, setNotes] = useState(monthlyValue.notes || "");
  const { updateMonthlyValue } = useEmployeeMonthlyValues(monthlyValue.employee_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateMonthlyValue({
      ...monthlyValue,
      amount: Number(amount),
      notes,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Valor Mensal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Mês de Referência</Label>
            <p className="text-muted-foreground mt-2">
              {new Date(monthlyValue.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações opcionais..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
