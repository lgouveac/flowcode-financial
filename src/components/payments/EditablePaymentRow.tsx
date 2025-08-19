import React, { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Edit2 } from "lucide-react";
import type { Payment } from "@/types/payment";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface EditablePaymentRowProps {
  payment: Payment;
  onPaymentUpdated: () => void;
}

export const EditablePaymentRow = ({ 
  payment, 
  onPaymentUpdated
}: EditablePaymentRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(payment.amount.toString());
  const [editDueDate, setEditDueDate] = useState(payment.due_date);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          amount: parseFloat(editAmount),
          due_date: editDueDate
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Parcela atualizada",
        description: "Valor e data de vencimento atualizados com sucesso."
      });

      setIsEditing(false);
      onPaymentUpdated();
    } catch (error) {
      console.error("Erro ao atualizar parcela:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a parcela.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditAmount(payment.amount.toString());
    setEditDueDate(payment.due_date);
    setIsEditing(false);
  };

  const formattedDueDate = payment.due_date 
    ? format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: ptBR })
    : 'Data não definida';

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>{payment.clients?.name || 'Cliente não encontrado'}</TableCell>
      <TableCell>{payment.description || 'Sem descrição'}</TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            type="number"
            step="0.01"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            className="w-24"
          />
        ) : (
          formatCurrency(payment.amount)
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            className="w-32"
          />
        ) : (
          formattedDueDate
        )}
      </TableCell>
      <TableCell>{(payment.payment_method || '').toUpperCase()}</TableCell>
      <TableCell>
        <PaymentStatusBadge status={payment.status} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};