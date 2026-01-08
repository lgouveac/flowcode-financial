import React, { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Check, X, Edit2, Trash2 } from "lucide-react";
import type { Payment } from "@/types/payment";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatDateForInput } from "@/utils/dateUtils";

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
  const [editPaymentDate, setEditPaymentDate] = useState(payment.payment_date || "");
  const [payOnDelivery, setPayOnDelivery] = useState(Boolean(payment.Pagamento_Por_Entrega));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validar payment_date se status for 'paid' (exceto quando for Pagamento por entrega)
      if (editStatus === 'paid' && !editPaymentDate && !payOnDelivery) {
        toast({
          title: "Erro de validação",
          description: "Informe a data de pagamento ou marque 'Pagamento por entrega' ao definir como Pago.",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }

      // Garantir que strings vazias sejam convertidas para null
      const normalizedDueDate = payOnDelivery 
        ? null 
        : (editDueDate && typeof editDueDate === 'string' && editDueDate.trim() !== "" ? editDueDate : null);

      const { error } = await supabase
        .from('payments')
        .update({
          amount: parseFloat(editAmount),
          due_date: normalizedDueDate,
          status: editStatus,
          payment_date: payOnDelivery ? null : (editPaymentDate || null),
          Pagamento_Por_Entrega: payOnDelivery
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Parcela atualizada",
        description: "Informações atualizadas com sucesso."
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
    setEditPaymentDate(payment.payment_date || "");
    setPayOnDelivery(Boolean(payment.Pagamento_Por_Entrega));
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
            value={editDueDate || ""}
            onChange={(e) => setEditDueDate(e.target.value || null)}
            className="w-32"
            placeholder={payOnDelivery ? "Opcional" : ""}
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
        {isEditing ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`pay_on_delivery_${payment.id}`}
                checked={payOnDelivery}
                onCheckedChange={(checked) => {
                  const value = Boolean(checked);
                  setPayOnDelivery(value);
                  if (value) {
                    setEditPaymentDate("");
                    setEditDueDate(null);
                  }
                }}
              />
              <Label htmlFor={`pay_on_delivery_${payment.id}`} className="text-xs">
                Entrega
              </Label>
            </div>
            {payOnDelivery ? (
              <div className="text-xs text-gray-600">
                Na entrega
              </div>
            ) : (
              <Input
                type="date"
                value={editPaymentDate}
                onChange={(e) => setEditPaymentDate(e.target.value)}
                className="w-32 h-8"
                placeholder="Data pgto"
              />
            )}
            {editStatus === 'paid' && !payOnDelivery && !editPaymentDate && (
              <div className="text-xs text-red-500">
                Obrigatória
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm">
            {payment.Pagamento_Por_Entrega ? (
              <span className="text-blue-600">Na entrega</span>
            ) : payment.payment_date ? (
              format(parseISO(payment.payment_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
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