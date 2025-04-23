
import React, { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Payment } from "@/types/payment";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";

interface PaymentRowProps {
  payment: Payment;
  onEmailSent: () => void;
  onPaymentUpdated: () => void;
}

export const PaymentRow = ({ payment, onEmailSent, onPaymentUpdated }: PaymentRowProps) => {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Recebimento excluído",
        description: "O recebimento foi excluído com sucesso."
      });
      onPaymentUpdated();
    } catch (error) {
      console.error("Erro ao excluir recebimento:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o recebimento.",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadgeVariant = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Atrasado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  return (
    <TableRow>
      <TableCell>{payment.clients?.name}</TableCell>
      <TableCell>{payment.description}</TableCell>
      <TableCell>{formatCurrency(payment.amount)}</TableCell>
      <TableCell>
        {format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: ptBR })}
      </TableCell>
      <TableCell>{payment.payment_method.toUpperCase()}</TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(payment.status)}>
          {getStatusLabel(payment.status)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Enviar email"
          >
            <Mail className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Recebimento</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este recebimento? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
};
