
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Payment } from "@/types/payment";

// Add onRefresh to props
interface PaymentTableProps {
  payments?: Payment[];
  onRefresh?: () => void;
}

export const PaymentTable = ({ payments = [], onRefresh }: PaymentTableProps) => {
  const { toast } = useToast();
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'pix':
        return 'PIX';
      case 'boleto':
        return 'Boleto';
      case 'credit_card':
        return 'Cartão de Crédito';
      default:
        return method;
    }
  };

  const handleSendEmail = async (payment) => {
    try {
      setSendingEmailId(payment.id);
      
      // Check if payment has an associated template
      let templateId = payment.email_template;
      
      // If no template is selected, fetch the default oneTime template
      if (!templateId) {
        const { data: defaultTemplate, error: templateError } = await supabase
          .from('email_templates')
          .select('id')
          .eq('type', 'clients')
          .eq('subtype', 'oneTime')
          .eq('is_default', true)
          .single();
          
        if (templateError || !defaultTemplate) {
          // Try to get the recurring template as fallback
          const { data: recurringTemplate, error: recurringError } = await supabase
            .from('email_templates')
            .select('id')
            .eq('type', 'clients')
            .eq('subtype', 'recurring')
            .eq('is_default', true)
            .single();
            
          if (recurringError || !recurringTemplate) {
            throw new Error('Nenhum template padrão encontrado. Por favor, crie um template para cobranças pontuais ou recorrentes.');
          }
          
          templateId = recurringTemplate.id;
        } else {
          templateId = defaultTemplate.id;
        }
      }
      
      // Get payment method as string
      let paymentMethodStr = 'PIX';
      if (payment.payment_method === 'boleto') paymentMethodStr = 'Boleto';
      if (payment.payment_method === 'credit_card') paymentMethodStr = 'Cartão de Crédito';
      
      // Get days until due
      const dueDate = new Date(payment.due_date);
      const today = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get client data
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('name, email, responsible_name, partner_name')
        .eq('id', payment.client_id)
        .single();
        
      if (clientError) {
        throw new Error(`Erro ao obter dados do cliente: ${clientError.message}`);
      }
      
      // Determine responsible name
      const responsibleName = clientData.responsible_name || clientData.partner_name || "Responsável";
      
      // Send email via the edge function
      const { error: emailError } = await supabase.functions.invoke(
        'send-billing-email',
        {
          body: JSON.stringify({
            to: clientData.email,
            templateId: templateId,
            data: {
              recipientName: clientData.name,
              responsibleName: responsibleName,
              billingValue: payment.amount,
              dueDate: payment.due_date,
              daysUntilDue: daysUntilDue,
              descricaoServico: payment.description,
              paymentMethod: paymentMethodStr
            }
          })
        }
      );
      
      if (emailError) {
        throw new Error(`Erro ao enviar email: ${emailError.message}`);
      }
      
      // Log the notification - fixed to match the database schema
      const { error: logError } = await supabase
        .from('email_notification_log')
        .insert({
          payment_id: payment.id,
          client_id: payment.client_id,
          days_before: daysUntilDue > 0 ? daysUntilDue : 0,
          due_date: payment.due_date,
          payment_type: 'oneTime',
          billing_id: payment.id, // Use payment_id for billing_id since it's required
          sent_at: new Date().toISOString() // Use sent_at instead of notification_date
        });
        
      if (logError) {
        console.error("Erro ao registrar notificação:", logError);
      }
      
      toast({
        title: "Email enviado com sucesso",
        description: `Email enviado para ${clientData.name}`,
      });

      // Call onRefresh if it exists
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingEmailId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                Nenhum recebimento encontrado
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.clients?.name || "Cliente não encontrado"}</TableCell>
                <TableCell>{payment.description}</TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                <TableCell>{payment.due_date ? format(new Date(payment.due_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}</TableCell>
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
                    onClick={() => handleSendEmail(payment)}
                    disabled={sendingEmailId === payment.id}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {sendingEmailId === payment.id ? 'Enviando...' : 'Enviar Email'}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
