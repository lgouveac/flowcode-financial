
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useEmployeeMonthlyValues } from "@/hooks/useEmployeeMonthlyValues";

interface NewMonthlyValueDialogProps {
  open: boolean;
  onClose: () => void;
  employeeId: string;
}

export const NewMonthlyValueDialog = ({ open, onClose, employeeId }: NewMonthlyValueDialogProps) => {
  const { toast } = useToast();
  const { addMonthlyValue } = useEmployeeMonthlyValues(employeeId);

  const [month, setMonth] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Format the month to ensure it's the first day of the month
      const formattedMonth = new Date(month + '-01').toISOString().split('T')[0];
      
      await addMonthlyValue({
        employee_id: employeeId,
        due_date: formattedMonth, // Use the correct field name
        due_data: Number(amount), // Use the correct field name
        notes,
      });

      onClose();
    } catch (error: any) {
      console.error("Error adding monthly value:", error);
      toast({
        title: "Erro ao adicionar valor mensal",
        description: error.message || "Não foi possível adicionar o valor mensal.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Valor Mensal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="month">Mês (YYYY-MM)</Label>
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button type="submit">Adicionar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
