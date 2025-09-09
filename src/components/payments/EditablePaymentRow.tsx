import React, { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Edit2, Trash2 } from "lucide-react";
import type { Payment } from "@/types/payment";
import { format, parseISO } from "date-fns";
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
  const [editStatus, setEditStatus] = useState(payment.status);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          amount: parseFloat(editAmount),
          due_date: editDueDate,
          status: editStatus
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Parcela atualizada",
        description: "Valor, data de vencimento e status atualizados com sucesso."
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

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir esta parcela? Esta ação não pode ser desfeita.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Parcela excluída",
        description: "A parcela foi excluída com sucesso."
      });

      onPaymentUpdated();
    } catch (error) {
      console.error("Erro ao excluir parcela:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a parcela.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setEditAmount(payment.amount.toString());
    setEditDueDate(payment.due_date);
    setEditStatus(payment.status);
    setIsEditing(false);
  };

  const formattedDueDate = payment.due_date 
    ? format(parseISO(payment.due_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
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
        {isEditing ? (
          <Select value={editStatus} onValueChange={setEditStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="overdue">Atrasado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
              <SelectItem value="billed">Faturado</SelectItem>
              <SelectItem value="awaiting_invoice">Aguardando Fatura</SelectItem>
              <SelectItem value="partially_paid">Parcialmente Pago</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <PaymentStatusBadge status={payment.status} />
        )}
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
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                disabled={isDeleting}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};