
import React, { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Payment, EditablePaymentFields } from "@/types/payment";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, getStatusColor, getPaymentMethodLabel } from "./utils/formatUtils";
import { sendPaymentEmail } from "./services/EmailSender";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

interface PaymentRowProps {
  payment: Payment;
  onEmailSent: () => void;
  onPaymentUpdated: () => void;
}

const paymentSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  due_date: z.date({
    required_error: "Data de vencimento é obrigatória",
  }),
  payment_date: z.date().optional().nullable(),
  payment_method: z.enum(["pix", "boleto", "credit_card"], {
    required_error: "Método de pagamento é obrigatório",
  }),
  status: z.enum(["pending", "billed", "awaiting_invoice", "paid", "overdue", "cancelled"], {
    required_error: "Status é obrigatório",
  }),
});

export const PaymentRow: React.FC<PaymentRowProps> = ({ payment, onEmailSent, onPaymentUpdated }) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      description: payment.description,
      amount: payment.amount,
      due_date: payment.due_date ? new Date(payment.due_date) : new Date(),
      payment_date: payment.payment_date ? new Date(payment.payment_date) : null,
      payment_method: payment.payment_method,
      status: payment.status,
    },
  });

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

  const onSubmit = async (data: z.infer<typeof paymentSchema>) => {
    try {
      setUpdating(true);
      
      // Format dates for the database
      const formattedData: EditablePaymentFields = {
        description: data.description,
        amount: data.amount,
        due_date: data.due_date.toISOString().split('T')[0],
        payment_date: data.payment_date ? data.payment_date.toISOString().split('T')[0] : null,
        payment_method: data.payment_method,
        status: data.status,
      };
      
      const { error } = await supabase
        .from('payments')
        .update(formattedData)
        .eq('id', payment.id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Recebimento atualizado",
        description: "As informações foram atualizadas com sucesso.",
      });
      
      setEditDialogOpen(false);
      onPaymentUpdated();
    } catch (error) {
      console.error("Erro ao atualizar recebimento:", error);
      toast({
        title: "Erro na atualização",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
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
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setEditDialogOpen(true)}
            >
              Editar
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleSendEmail}
              disabled={sending}
            >
              {sending ? 'Enviando...' : 'Enviar Email'}
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Recebimento</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Vencimento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Pagamento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Não pago</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pagamento</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="billed">Faturado</SelectItem>
                        <SelectItem value="awaiting_invoice">Aguardando Fatura</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="overdue">Atrasado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={updating}
                >
                  {updating ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
