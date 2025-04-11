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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarIcon, DollarSign, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";

interface PaymentRowProps {
  payment: Payment;
  onEmailSent: () => void;
  onPaymentUpdated: () => void;
}

const paymentSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  due_date: z.date({
    required_error: "Data de vencimento é obrigatória"
  }),
  payment_date: z.date().optional().nullable(),
  payment_method: z.enum(["pix", "boleto", "credit_card"], {
    required_error: "Método de pagamento é obrigatório"
  }),
  status: z.enum(["pending", "billed", "awaiting_invoice", "paid", "overdue", "cancelled", "partially_paid"], {
    required_error: "Status é obrigatório"
  }),
  paid_amount: z.coerce.number().optional()
});

export const PaymentRow: React.FC<PaymentRowProps> = ({
  payment,
  onEmailSent,
  onPaymentUpdated
}) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [partialPaymentDialogOpen, setPartialPaymentDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [partialAmount, setPartialAmount] = useState(payment.paid_amount || 0);

  // For partial payment
  const partialForm = useForm({
    defaultValues: {
      paid_amount: payment.paid_amount || 0,
      payment_date: payment.payment_date ? new Date(payment.payment_date) : new Date()
    }
  });

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      description: payment.description,
      amount: payment.amount,
      due_date: payment.due_date ? new Date(payment.due_date) : new Date(),
      payment_date: payment.payment_date ? new Date(payment.payment_date) : null,
      payment_method: payment.payment_method,
      status: payment.status,
      paid_amount: payment.paid_amount || 0
    }
  });

  // Function to handle status changes and update payment_date automatically
  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'paid' && !form.getValues('payment_date')) {
      // If status is changed to paid and there's no payment date, set it to today
      form.setValue('payment_date', new Date(), { shouldValidate: true });
    }
    
    form.setValue('status', newStatus as any, { shouldValidate: true });
  };

  const createCashFlowEntry = async (paymentData: any) => {
    // Only create cash flow entry for paid payments
    if (paymentData.status !== 'paid' || !paymentData.payment_date) {
      return;
    }
    
    try {
      // Check if cash flow entry already exists for this payment
      const { data: existingEntry, error: checkError } = await supabase
        .from('cash_flow')
        .select('id')
        .eq('payment_id', payment.id)
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking for existing cash flow entry:', checkError);
        return;
      }
        
      if (!existingEntry) {
        // Create cash flow entry
        const { error: insertError } = await supabase
          .from('cash_flow')
          .insert({
            type: 'income',
            description: payment.description,
            amount: payment.amount,
            date: paymentData.payment_date,
            category: 'payment',
            payment_id: payment.id
          });
            
        if (insertError) {
          console.error('Error creating cash flow entry:', insertError);
          toast({
            title: "Aviso",
            description: "Pagamento marcado como pago, mas houve erro ao registrar no fluxo de caixa.",
            variant: "destructive",
          });
        } else {
          console.log('Created cash flow entry for payment:', payment.id);
        }
      }
    } catch (error) {
      console.error('Unexpected error creating cash flow entry:', error);
    }
  };

  const handleSendEmail = async () => {
    try {
      setSending(true);
      const clientData = await sendPaymentEmail(payment);
      toast({
        title: "Email enviado com sucesso",
        description: `Email enviado para ${clientData.name}`
      });
      onEmailSent();
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleDeletePayment = async () => {
    try {
      setDeleting(true);
      const { error } = await supabase.from('payments').delete().eq('id', payment.id);
      if (error) {
        throw error;
      }
      toast({
        title: "Recebimento excluído",
        description: "O recebimento foi excluído com sucesso."
      });
      onPaymentUpdated();
    } catch (error) {
      console.error("Erro ao excluir recebimento:", error);
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const handlePartialPayment = async (data: any) => {
    try {
      setUpdating(true);
      if (data.paid_amount >= payment.amount) {
        toast({
          title: "Valor inválido",
          description: "O valor pago não pode ser maior ou igual ao valor total.",
          variant: "destructive"
        });
        return;
      }

      // Update the payment with partial payment info
      const { error } = await supabase.from('payments').update({
        status: 'partially_paid' as Payment['status'],
        paid_amount: data.paid_amount,
        payment_date: data.payment_date ? data.payment_date.toISOString().split('T')[0] : null
      }).eq('id', payment.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Pagamento parcial registrado",
        description: `Valor de ${formatCurrency(data.paid_amount)} registrado com sucesso.`
      });
      setPartialPaymentDialogOpen(false);
      onPaymentUpdated();
    } catch (error) {
      console.error("Erro ao registrar pagamento parcial:", error);
      toast({
        title: "Erro no registro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof paymentSchema>) => {
    try {
      setUpdating(true);

      // Format dates for the database
      const formattedData: EditablePaymentFields & {
        paid_amount?: number;
      } = {
        description: data.description,
        amount: data.amount,
        due_date: data.due_date.toISOString().split('T')[0],
        payment_date: data.payment_date ? data.payment_date.toISOString().split('T')[0] : null,
        payment_method: data.payment_method,
        status: data.status
      };

      // Include paid_amount if status is partially_paid
      if (data.status === 'partially_paid') {
        formattedData.paid_amount = data.paid_amount;
      }

      // Use type assertion to handle the status type
      const { error } = await supabase.from('payments').update(formattedData as any).eq('id', payment.id);
      if (error) {
        throw error;
      }
      
      // Create cash flow entry if payment is marked as paid
      if (data.status === 'paid') {
        await createCashFlowEntry(formattedData);
      }
      
      toast({
        title: "Recebimento atualizado",
        description: "As informações foram atualizadas com sucesso."
      });
      setEditDialogOpen(false);
      onPaymentUpdated();
    } catch (error) {
      console.error("Erro ao atualizar recebimento:", error);
      toast({
        title: "Erro na atualização",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  // Calculate the remaining amount for partially paid invoices
  const remainingAmount = payment.status === 'partially_paid' && payment.paid_amount ? payment.amount - payment.paid_amount : payment.amount;

  return (
    <>
      <TableRow key={payment.id}>
        <TableCell>{payment.clients?.name || "Cliente não encontrado"}</TableCell>
        <TableCell>{payment.description}</TableCell>
        <TableCell>
          {payment.status === 'partially_paid' && payment.paid_amount ? (
            <div>
              <div>{formatCurrency(payment.amount)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Pago: {formatCurrency(payment.paid_amount)} | 
                Restante: {formatCurrency(remainingAmount)}
              </div>
            </div>
          ) : formatCurrency(payment.amount)}
        </TableCell>
        <TableCell>
          {payment.due_date ? format(new Date(payment.due_date), "dd/MM/yyyy", {
            locale: ptBR
          }) : "-"}
        </TableCell>
        <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
        <TableCell>
          <Badge className={getStatusColor(payment.status)}>
            {payment.status === 'paid' ? 'Pago' : payment.status === 'pending' ? 'Pendente' : payment.status === 'partially_paid' ? 'Pago Parcial' : payment.status}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => setEditDialogOpen(true)}>
              Editar
            </Button>
            <Button size="sm" variant="outline" onClick={handleSendEmail} disabled={sending}>
              {sending ? 'Enviando...' : 'Enviar Email'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50 hover:text-red-600">
                  <Trash2Icon className="h-4 w-4" />
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
                  <AlertDialogAction onClick={handleDeletePayment} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                    {deleting ? 'Excluindo...' : 'Excluir'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TableCell>
      </TableRow>

      {/* Partial Payment Dialog */}
      <Dialog open={partialPaymentDialogOpen} onOpenChange={setPartialPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento Parcial</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={partialForm.handleSubmit(handlePartialPayment)} className="space-y-4">
            <div className="space-y-2">
              <Label>Valor Total</Label>
              <div className="px-3 py-2 border rounded-md bg-muted/50">
                {formatCurrency(payment.amount)}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paid_amount">Valor Recebido</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5">R$</span>
                <Input 
                  id="paid_amount" 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  max={payment.amount - 0.01} 
                  className="pl-8" 
                  {...partialForm.register('paid_amount', {
                    valueAsNumber: true,
                    required: true
                  })} 
                />
              </div>
              {partialForm.formState.errors.paid_amount && (
                <p className="text-sm font-medium text-destructive">
                  Valor pago é obrigatório
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Data de Pagamento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {partialForm.watch('payment_date') ? 
                      format(partialForm.watch('payment_date'), "PPP", { locale: ptBR }) : 
                      "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={partialForm.watch('payment_date')} 
                    onSelect={date => partialForm.setValue('payment_date', date || new Date())} 
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Valor Restante</Label>
              <div className="px-3 py-2 border rounded-md bg-muted/50">
                {formatCurrency(payment.amount - (partialForm.watch('paid_amount') || 0))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setPartialPaymentDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={updating || 
                  partialForm.watch('paid_amount') <= 0 || 
                  partialForm.watch('paid_amount') >= payment.amount}
              >
                {updating ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
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
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
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
                            variant="outline" 
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
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
                          disabled={(date) => date < new Date("1900-01-01")} 
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
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
                            variant="outline" 
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
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
                          selected={field.value || undefined} 
                          onSelect={(date) => field.onChange(date)} 
                          disabled={(date) => date < new Date("1900-01-01")} 
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      onValueChange={(value) => handleStatusChange(value)} 
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
                        <SelectItem value="partially_paid">Pago Parcial</SelectItem>
                        <SelectItem value="overdue">Atrasado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} 
              />
              
              {form.watch('status') === 'partially_paid' && (
                <FormField 
                  control={form.control} 
                  name="paid_amount" 
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Pago (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0.01" 
                          max={form.watch('amount') - 0.01} 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} 
                />
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updating}>
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
