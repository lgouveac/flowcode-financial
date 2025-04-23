
import React, { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RecurringBilling } from "@/types/billing";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";

interface RecurringBillingRowProps {
  billing: RecurringBilling;
  onRefresh: () => void;
  onOpenDetails: (billing: RecurringBilling) => void;
  onDuplicate?: (billing: RecurringBilling) => void;
}

export const RecurringBillingRow = ({ 
  billing, 
  onRefresh, 
  onOpenDetails,
  onDuplicate 
}: RecurringBillingRowProps) => {
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('recurring_billing')
        .delete()
        .eq('id', billing.id);

      if (error) throw error;

      toast({
        title: "Cobrança excluída",
        description: "A cobrança recorrente foi excluída com sucesso."
      });
      onRefresh();
    } catch (error) {
      console.error("Erro ao excluir cobrança:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a cobrança.",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusBadgeVariant = (status: RecurringBilling['status']) => {
    switch (status) {
      case 'paid':
        return 'default';
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

  const getPaymentMethodLabel = (method: RecurringBilling['payment_method']) => {
    const labels = {
      pix: 'PIX',
      boleto: 'Boleto',
      credit_card: 'Cartão de Crédito'
    };
    return labels[method];
  };

  return (
    <TableRow 
      className="group hover:bg-muted/50 cursor-pointer"
      onClick={() => onOpenDetails(billing)}
    >
      <TableCell>{billing.clients?.name || "—"}</TableCell>
      <TableCell>{billing.description}</TableCell>
      <TableCell>
        {billing.current_installment}/{billing.installments}
      </TableCell>
      <TableCell>
        {new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(billing.amount)}
      </TableCell>
      <TableCell>Dia {billing.due_day}</TableCell>
      <TableCell>{getPaymentMethodLabel(billing.payment_method)}</TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(billing.status)}>
          {billing.status === 'paid' ? 'Pago' : 
           billing.status === 'pending' ? 'Pendente' : 
           billing.status === 'overdue' ? 'Atrasado' : 'Cancelado'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex space-x-2" onClick={e => e.stopPropagation()}>
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Cobrança Recorrente</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta cobrança? Esta ação não pode ser desfeita.
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
      {onDuplicate && (
        <TableCell className="text-right pr-4">
          <Button
            size="icon"
            variant="ghost"
            title="Duplicar cobrança recorrente"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(billing);
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
};
