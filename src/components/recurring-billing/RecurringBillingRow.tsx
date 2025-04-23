
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RecurringBilling } from "@/types/billing";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Mail, Pencil, Trash2 } from "lucide-react";
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
    }
  };

  const getStatusBadgeVariant = (status: RecurringBilling['status']) => {
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

  const getStatusLabel = (status: RecurringBilling['status']) => {
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
      <TableCell>{billing.clients?.name}</TableCell>
      <TableCell>{billing.description}</TableCell>
      <TableCell>{formatCurrency(billing.amount)}</TableCell>
      <TableCell>Dia {billing.due_day}</TableCell>
      <TableCell>{billing.payment_method.toUpperCase()}</TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(billing.status)}>
          {getStatusLabel(billing.status)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            title="Editar"
            onClick={() => onOpenDetails(billing)}
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
          {onDuplicate && (
            <Button
              variant="ghost"
              size="icon"
              title="Duplicar"
              onClick={() => onDuplicate(billing)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
