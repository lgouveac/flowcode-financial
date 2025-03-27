
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { RecurringBilling } from "@/types/billing";
import type { Payment } from "@/types/payment";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, Check, CreditCard, File, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { EmailTemplate } from "@/types/email";

interface PaymentDetailsDialogProps {
  billingId: string;
  open: boolean;
  onClose: () => void;
}

export const PaymentDetailsDialog = ({ billingId, open, onClose }: PaymentDetailsDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<RecurringBilling & { clients?: { name: string; email?: string; responsible_name?: string } }>();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [editingClient, setEditingClient] = useState<{ id: string; name: string; responsible_name?: string } | null>(null);
  const { toast } = useToast();

  // For editing fields
  const [editMode, setEditMode] = useState(false);
  const [editedBilling, setEditedBilling] = useState<Partial<RecurringBilling>>({});
  const [editedResponsible, setEditedResponsible] = useState<string>("");

  useEffect(() => {
    if (open) {
      fetchBillingDetails();
      fetchEmailTemplates();
    }
  }, [open, billingId]);

  const fetchBillingDetails = async () => {
    setLoading(true);
    try {
      console.log("Fetching billing details for ID:", billingId);
      
      // Fetch billing details - include responsible_name
      const { data: billingData, error: billingError } = await supabase
        .from('recurring_billing')
        .select('*, clients(id, name, email, responsible_name)')
        .eq('id', billingId)
        .single();

      if (billingError) {
        console.error("Error fetching billing details:", billingError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes do recebimento.",
          variant: "destructive",
        });
        return;
      }

      // Fetch associated payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', billingData.client_id)
        .order('due_date', { ascending: false });

      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError);
      }

      console.log("Billing details:", billingData);
      console.log("Associated payments:", paymentsData);

      setBilling(billingData as any);
      setEditedBilling({
        description: billingData.description,
        amount: billingData.amount,
        due_day: billingData.due_day,
        installments: billingData.installments,
        current_installment: billingData.current_installment,
        payment_method: billingData.payment_method,
        status: billingData.status,
        start_date: billingData.start_date,
        end_date: billingData.end_date
      });
      
      // Set responsible name for editing
      setEditedResponsible(billingData.clients?.responsible_name || "");
      
      // Set client info for editing
      if (billingData.clients) {
        setEditingClient({
          id: billingData.clients.id,
          name: billingData.clients.name,
          responsible_name: billingData.clients.responsible_name
        });
      }
      
      setPayments(paymentsData || []);
    } catch (error) {
      console.error("Error in fetchBillingDetails:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar os detalhes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('type', 'clients')
        .eq('subtype', 'recurring');

      if (error) {
        console.error("Error fetching email templates:", error);
        return;
      }

      console.log("Email templates:", data);
      setTemplates(data || []);
    } catch (error) {
      console.error("Error in fetchEmailTemplates:", error);
    }
  };

  const handleSaveChanges = async () => {
    try {
      // Update billing record
      const { error: billingError } = await supabase
        .from('recurring_billing')
        .update(editedBilling)
        .eq('id', billingId);

      if (billingError) {
        console.error("Error updating billing:", billingError);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o recebimento.",
          variant: "destructive",
        });
        return;
      }

      // Update client's responsible name if changed
      if (editingClient && editedResponsible !== (billing?.clients?.responsible_name || "")) {
        const { error: clientError } = await supabase
          .from('clients')
          .update({ responsible_name: editedResponsible })
          .eq('id', editingClient.id);

        if (clientError) {
          console.error("Error updating client responsible name:", clientError);
          toast({
            title: "Aviso",
            description: "Recebimento atualizado, mas não foi possível atualizar o responsável.",
            variant: "warning",
          });
          return;
        }
      }

      toast({
        title: "Sucesso",
        description: "Recebimento atualizado com sucesso.",
      });
      
      // Refresh the data
      fetchBillingDetails();
      setEditMode(false);
    } catch (error) {
      console.error("Error in handleSaveChanges:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar as alterações.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async () => {
    if (!selectedTemplate || !billing?.clients?.email) {
      toast({
        title: "Aviso",
        description: "Selecione um template e verifique se o cliente possui email.",
        variant: "warning",
      });
      return;
    }

    setSendingEmail(true);
    try {
      const template = templates.find(t => t.id === selectedTemplate);
      if (!template) {
        throw new Error("Template not found");
      }

      const dueDate = new Date();
      dueDate.setDate(billing.due_day);

      const { error } = await supabase.functions.invoke('send-billing-email', {
        body: {
          to: billing.clients.email,
          subject: template.subject,
          content: template.content,
          recipientName: billing.clients.name,
          billingValue: billing.amount,
          dueDate: dueDate.toISOString().split('T')[0],
          currentInstallment: billing.current_installment,
          totalInstallments: billing.installments,
          paymentMethod: billing.payment_method === 'pix' ? 'PIX' : 
                         billing.payment_method === 'boleto' ? 'Boleto' : 'Cartão de Crédito'
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Email enviado com sucesso.",
      });
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o email.",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const getStatusBadgeVariant = (status: RecurringBilling['status'] | Payment['status']) => {
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

  const getStatusLabel = (status: RecurringBilling['status'] | Payment['status']) => {
    const statusLabels: Record<string, string> = {
      pending: 'Pendente',
      billed: 'Faturado',
      awaiting_invoice: 'Aguardando Fatura',
      paid: 'Pago',
      overdue: 'Atrasado',
      cancelled: 'Cancelado'
    };
    return statusLabels[status] || status;
  };

  const getPaymentMethodLabel = (method: 'pix' | 'boleto' | 'credit_card') => {
    const methodLabels: Record<string, string> = {
      pix: 'PIX',
      boleto: 'Boleto',
      credit_card: 'Cartão de Crédito'
    };
    return methodLabels[method] || method;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Recebimento</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-6">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!billing) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Recebimento</DialogTitle>
            <DialogDescription>
              Recebimento não encontrado ou ocorreu um erro ao carregar os detalhes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Recebimento</DialogTitle>
          <DialogDescription>
            {editMode ? 
              "Edite os campos do recebimento e clique em Salvar para confirmar as alterações." :
              "Visualize e gerencie os detalhes deste recebimento recorrente."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-end">
            {editMode ? (
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveChanges}>
                  Salvar
                </Button>
              </div>
            ) : (
              <Button onClick={() => setEditMode(true)}>
                Editar
              </Button>
            )}
          </div>

          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="payments">Pagamentos</TabsTrigger>
              <TabsTrigger value="notification">Notificação</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 pt-4">
              {editMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-name">Cliente</Label>
                      <Input 
                        id="client-name" 
                        value={editingClient?.name || ""} 
                        disabled 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="responsible-name">Responsável</Label>
                      <Input 
                        id="responsible-name" 
                        value={editedResponsible} 
                        onChange={(e) => setEditedResponsible(e.target.value)} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Input 
                        id="description" 
                        value={editedBilling.description || ""} 
                        onChange={(e) => setEditedBilling({...editedBilling, description: e.target.value})} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="amount">Valor (R$)</Label>
                      <Input 
                        id="amount" 
                        type="number" 
                        value={editedBilling.amount || 0} 
                        onChange={(e) => setEditedBilling({...editedBilling, amount: parseFloat(e.target.value)})} 
                        step="0.01"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="due-day">Dia de Vencimento</Label>
                      <Input 
                        id="due-day" 
                        type="number" 
                        value={editedBilling.due_day || 1} 
                        onChange={(e) => setEditedBilling({...editedBilling, due_day: parseInt(e.target.value)})}
                        min="1"
                        max="31" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="payment-method">Método de Pagamento</Label>
                      <Select 
                        value={editedBilling.payment_method} 
                        onValueChange={(value: 'pix' | 'boleto' | 'credit_card') => 
                          setEditedBilling({...editedBilling, payment_method: value})
                        }
                      >
                        <SelectTrigger id="payment-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="boleto">Boleto</SelectItem>
                          <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={editedBilling.status} 
                        onValueChange={(value: RecurringBilling['status']) => 
                          setEditedBilling({...editedBilling, status: value})
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="billed">Faturado</SelectItem>
                          <SelectItem value="awaiting_invoice">Aguardando Fatura</SelectItem>
                          <SelectItem value="overdue">Atrasado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                          <SelectItem value="paid">Pago</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="current-installment">Parcela Atual</Label>
                      <Input 
                        id="current-installment" 
                        type="number" 
                        value={editedBilling.current_installment || 1} 
                        onChange={(e) => setEditedBilling({...editedBilling, current_installment: parseInt(e.target.value)})}
                        min="1" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="total-installments">Total de Parcelas</Label>
                      <Input 
                        id="total-installments" 
                        type="number" 
                        value={editedBilling.installments || 1} 
                        onChange={(e) => setEditedBilling({...editedBilling, installments: parseInt(e.target.value)})}
                        min="1" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Data de Início</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editedBilling.start_date ? format(new Date(editedBilling.start_date), "PPP") : "Selecione"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={editedBilling.start_date ? new Date(editedBilling.start_date) : undefined}
                            onSelect={(date) => setEditedBilling({...editedBilling, start_date: date ? format(date, "yyyy-MM-dd") : undefined})}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end-date">Data de Término</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editedBilling.end_date ? format(new Date(editedBilling.end_date), "PPP") : "Indefinido"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={editedBilling.end_date ? new Date(editedBilling.end_date) : undefined}
                            onSelect={(date) => setEditedBilling({...editedBilling, end_date: date ? format(date, "yyyy-MM-dd") : undefined})}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-md border p-6 space-y-4">
                    <h3 className="text-lg font-medium">Informações Básicas</h3>
                    <div className="mt-2 space-y-2">
                      <p><span className="font-medium">Cliente:</span> {(billing as any).clients?.name}</p>
                      <p><span className="font-medium">Responsável:</span> {(billing as any).clients?.responsible_name || "Não informado"}</p>
                      <p><span className="font-medium">Descrição:</span> {billing.description}</p>
                      <p><span className="font-medium">Valor:</span> R$ {billing.amount.toFixed(2)}</p>
                      <p><span className="font-medium">Dia de Vencimento:</span> {billing.due_day}</p>
                      <p><span className="font-medium">Método de Pagamento:</span> {getPaymentMethodLabel(billing.payment_method)}</p>
                      <p>
                        <span className="font-medium">Status:</span>{" "}
                        <Badge variant={getStatusBadgeVariant(billing.status)}>
                          {getStatusLabel(billing.status)}
                        </Badge>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-md border p-6 space-y-4">
                    <h3 className="text-lg font-medium">Informações de Parcelamento</h3>
                    <div className="mt-2 space-y-2">
                      <p><span className="font-medium">Parcela Atual:</span> {billing.current_installment} de {billing.installments}</p>
                      <p><span className="font-medium">Data de Início:</span> {billing.start_date ? format(new Date(billing.start_date), "dd/MM/yyyy") : "Não definido"}</p>
                      <p><span className="font-medium">Data de Término:</span> {billing.end_date ? format(new Date(billing.end_date), "dd/MM/yyyy") : "Indefinido"}</p>
                      {billing.payment_date && (
                        <p><span className="font-medium">Data de Pagamento:</span> {format(new Date(billing.payment_date), "dd/MM/yyyy")}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="payments" className="space-y-4 pt-4">
              <div className="rounded-md border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-left font-medium">Descrição</th>
                      <th className="p-3 text-left font-medium">Valor</th>
                      <th className="p-3 text-left font-medium">Vencimento</th>
                      <th className="p-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length > 0 ? payments.map((payment) => (
                      <tr key={payment.id} className="border-t">
                        <td className="p-3">{payment.description}</td>
                        <td className="p-3">R$ {payment.amount.toFixed(2)}</td>
                        <td className="p-3">{format(new Date(payment.due_date), "dd/MM/yyyy")}</td>
                        <td className="p-3">
                          <Badge variant={getStatusBadgeVariant(payment.status)}>
                            {getStatusLabel(payment.status)}
                          </Badge>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="p-3 text-center text-muted-foreground">
                          Nenhum pagamento encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="notification" className="space-y-4 pt-4">
              <div className="space-y-6">
                <div className="rounded-md border p-6 space-y-4">
                  <h3 className="text-lg font-medium">Enviar Notificação</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-template">Template de Email</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger id="email-template">
                          <SelectValue placeholder="Selecione um template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <p><span className="font-medium">Email do Cliente:</span> {billing.clients?.email || "Não disponível"}</p>
                    </div>

                    <Button 
                      className="w-full"
                      onClick={handleSendEmail} 
                      disabled={!selectedTemplate || !billing.clients?.email || sendingEmail}
                    >
                      {sendingEmail ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-b-2 border-current"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Email
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border p-6 space-y-4">
                  <h3 className="text-lg font-medium">Exportar Documentos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="w-full">
                      <File className="h-4 w-4 mr-2" />
                      Gerar PDF
                    </Button>
                    <Button variant="outline" className="w-full">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Gerar Boleto
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
