import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Send, Copy, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { RecurringBilling } from "@/types/billing";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditBillingDialog } from "./EditBillingDialog";
import { DeleteBillingDialog } from "./DeleteBillingDialog";
import { DuplicateBillingDialog } from "./DuplicateBillingDialog";
import { EmailTemplate } from "@/types/email";

interface RecurringBillingRowProps {
  billing: RecurringBilling;
  onRefresh: () => void;
  enableDuplicate?: boolean;
  templates: EmailTemplate[];
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

export const RecurringBillingRow = ({ billing, onRefresh, enableDuplicate = false, templates }: RecurringBillingRowProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  const statusInfo = RecurringBillingRowStatus[billing.status] || RecurringBillingRowStatus.pending;
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
      return "Data inválida";
    }
  };

  const getDueDate = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), billing.due_day);
  };

  return (
    <TableRow>
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
        {billing.current_installment}/{billing.installments}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/send-email?billingId=${billing.id}&clientId=${billing.client_id}`}>
                <Send className="mr-2 h-4 w-4" />
                Enviar Email
              </Link>
            </DropdownMenuItem>
            {enableDuplicate && (
              <DropdownMenuItem onClick={() => setShowDuplicateDialog(true)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>

      <EditBillingDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        billing={billing}
        onSuccess={onRefresh}
      />

      <DeleteBillingDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        billingId={billing.id}
        billingDescription={billing.description}
        onSuccess={onRefresh}
      />

      {enableDuplicate && (
        <DuplicateBillingDialog
          open={showDuplicateDialog}
          onClose={() => setShowDuplicateDialog(false)}
          billing={billing}
          onSuccess={onRefresh}
          templates={templates}
        />
      )}
    </TableRow>
  );
};
