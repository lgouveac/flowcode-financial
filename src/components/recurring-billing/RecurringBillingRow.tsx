
import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Copy } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { RecurringBilling } from "@/types/billing";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EmailTemplate } from "@/types/email";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";

interface RecurringBillingRowProps {
  billing: RecurringBilling;
  onRefresh: () => void;
  enableDuplicate?: boolean;
  templates: EmailTemplate[];
  onOpenDetails?: (billing: RecurringBilling) => void;
  onDuplicate?: (billing: RecurringBilling) => Promise<void>;
}

export const RecurringBillingRowStatus = {
  pending: { label: "Pendente", color: "bg-yellow-500" },
  paid: { label: "Pago", color: "bg-green-500" },
  overdue: { label: "Atrasado", color: "bg-red-500" },
  cancelled: { label: "Cancelado", color: "bg-gray-500" },
  partially_paid: { label: "Parcialmente Pago", color: "bg-blue-500" },
  billed: { label: "Faturado", color: "bg-purple-500" },
  awaiting_invoice: { label: "Aguardando NF", color: "bg-orange-500" },
};

export const RecurringBillingRow = ({ billing, onRefresh, enableDuplicate = false, templates, onOpenDetails, onDuplicate }: RecurringBillingRowProps) => {
  // Detectar tipos: billing virtual agrupado, pagamento expandido individual, ou billing normal
  const isVirtualBilling = Boolean(billing.related_payments);
  const isExpandedPayment = Boolean(billing.individual_payment);
  
  let statusInfo;
  
  if (isExpandedPayment) {
    // Para pagamento expandido (ambos escopos): mostrar status real (pendente, pago, etc)
    const realStatus = billing.individual_payment?.status || billing.status;
    statusInfo = RecurringBillingRowStatus[realStatus] || RecurringBillingRowStatus.pending;
  } else if (isVirtualBilling) {
    // Para escopo fechado agrupado: apenas Ativo/Inativo
    statusInfo = billing.status === 'cancelled' 
      ? { label: "Inativo", color: "bg-gray-500" }
      : { label: "Ativo", color: "bg-green-500" };
  } else {
    // Para escopo aberto agrupado: apenas Ativo/Inativo
    statusInfo = billing.status === 'cancelled' 
      ? { label: "Inativo", color: "bg-gray-500" }
      : { label: "Ativo", color: "bg-green-500" };
  }
  
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  
  const handleViewDetails = () => {
    if (onOpenDetails) {
      onOpenDetails(billing);
    }
  };

  const handleDuplicateClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDuplicate) return;
    
    try {
      setDuplicating(true);
      await onDuplicate(billing);
      toast({
        title: "Cobrança duplicada",
        description: "A cobrança foi duplicada com sucesso."
      });
    } catch (error) {
      console.error("Erro ao duplicar cobrança:", error);
      toast({
        title: "Erro ao duplicar",
        description: "Não foi possível duplicar a cobrança.",
        variant: "destructive"
      });
    } finally {
      setDuplicating(false);
    }
  };

  const handleDeleteClick = async () => {
    try {
      setDeleting(true);
      
      // Verificar se é billing virtual (escopo fechado agrupado)
      if (isVirtualBilling && billing.related_payments) {
        // Deletar todos os pagamentos relacionados (escopo fechado)
        const paymentIds = billing.related_payments.map(p => p.id);
        
        const { error } = await supabase
          .from('payments')
          .delete()
          .in('id', paymentIds);

        if (error) throw error;

        toast({
          title: "Recebimentos excluídos",
          description: `${billing.related_payments.length} recebimentos foram excluídos com sucesso.`
        });
      } else if (isExpandedPayment && billing.individual_payment) {
        // Deletar pagamento individual expandido
        const { error } = await supabase
          .from('payments')
          .delete()
          .eq('id', billing.individual_payment.id);

        if (error) throw error;

        toast({
          title: "Recebimento excluído",
          description: "O recebimento foi excluído com sucesso."
        });
      } else {
        // Billing normal (escopo aberto) - só deletar se o ID for um UUID válido
        if (billing.id && billing.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          const { error } = await supabase
            .from('recurring_billing')
            .delete()
            .eq('id', billing.id);

          if (error) throw error;

          toast({
            title: "Cobrança recorrente excluída",
            description: "A cobrança foi excluída com sucesso."
          });
        } else {
          throw new Error("ID inválido para exclusão");
        }
      }
      
      onRefresh();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir.",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <TableRow 
      className="hover:bg-muted/50"
      onClick={handleViewDetails}
    >
      <TableCell className="font-medium">{billing.clients?.name || "Cliente não encontrado"}</TableCell>
      <TableCell>{billing.description}</TableCell>
      <TableCell>{formatCurrency(billing.amount)}</TableCell>
      <TableCell>Dia {billing.due_day}</TableCell>
      <TableCell>
        <Badge variant="outline" className={`${statusInfo.color} text-white`}>
          {statusInfo.label}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            title="Editar"
            onClick={e => {
              e.stopPropagation();
              handleViewDetails();
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          {enableDuplicate && (
            <Button
              variant="ghost"
              size="icon"
              title="Duplicar"
              onClick={handleDuplicateClick}
              disabled={duplicating}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Excluir"
                onClick={e => e.stopPropagation()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-background">
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Cobrança Recorrente</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta cobrança recorrente? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteClick}
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
