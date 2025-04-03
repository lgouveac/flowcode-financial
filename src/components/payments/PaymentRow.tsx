
import React, { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Payment } from "@/types/payment";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, getStatusColor, getPaymentMethodLabel } from "./utils/formatUtils";
import { sendPaymentEmail } from "./services/EmailSender";

interface PaymentRowProps {
  payment: Payment;
  onEmailSent: () => void;
}

export const PaymentRow: React.FC<PaymentRowProps> = ({ payment, onEmailSent }) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const handleSendEmail = async () => {
    try {
      setSending(true);
      
      const clientData = await sendPaymentEmail(payment);
      
      toast({
        title: "Email enviado com sucesso",
        description: `Email enviado para ${clientData.name}`,
      });

      onEmailSent();
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <TableRow key={payment.id}>
      <TableCell>{payment.clients?.name || "Cliente não encontrado"}</TableCell>
      <TableCell>{payment.description}</TableCell>
      <TableCell>{formatCurrency(payment.amount)}</TableCell>
      <TableCell>
        {payment.due_date ? format(new Date(payment.due_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
      </TableCell>
      <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
      <TableCell>
        <Badge className={getStatusColor(payment.status)}>
          {payment.status === 'paid' ? 'Pago' : payment.status === 'pending' ? 'Pendente' : payment.status}
        </Badge>
      </TableCell>
      <TableCell>
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleSendEmail}
          disabled={sending}
        >
          {sending ? 'Enviando...' : 'Enviar Email'}
        </Button>
      </TableCell>
    </TableRow>
  );
};
