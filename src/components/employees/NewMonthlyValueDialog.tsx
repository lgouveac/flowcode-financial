
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useEmployeeMonthlyValues } from "@/hooks/useEmployeeMonthlyValues";

interface NewMonthlyValueDialogProps {
  employeeId: string;
  open: boolean;
  onClose: () => void;
}

export const NewMonthlyValueDialog = ({ employeeId, open, onClose }: NewMonthlyValueDialogProps) => {
  const [month, setMonth] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const { addMonthlyValue } = useEmployeeMonthlyValues(employeeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await addMonthlyValue({
      employee_id: employeeId,
      month: new Date(month).toISOString(),
      amount: Number(amount),
      notes,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Valor Mensal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="month">Mês de Referência</Label>
            <Input
              id="month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
            />
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
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
