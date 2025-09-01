import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientSelector } from "./ClientSelector";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface Client {
  id: string;
  name: string;
}

interface SimplePaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clients: Client[];
}

export function SimplePaymentDialog({ 
  open, 
  onClose, 
  onSuccess, 
  clients = [] 
}: SimplePaymentDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentType, setPaymentType] = useState<'recurring' | 'onetime'>('onetime');
  const [installmentsForClosed, setInstallmentsForClosed] = useState("1");
  const [installmentValues, setInstallmentValues] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form data
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | 'credit_card'>('pix');
  const [installments, setInstallments] = useState("1");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'pending' | 'paid'>('pending');
  const [paymentDate, setPaymentDate] = useState("");
  const [payOnDelivery, setPayOnDelivery] = useState(false);
  const [isMeasuredMonthly, setIsMeasuredMonthly] = useState(false);
  
  // Verificar se clients é undefined ou não é um array
  const safeClients = Array.isArray(clients) 
    ? clients.filter(client => client && typeof client === 'object' && client.id && client.name) 
    : [];
  
  // Carregar e processar os dados quando o diálogo é aberto
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      // Curto timeout para garantir que a UI atualize
      setTimeout(() => setIsLoading(false), 250);
    }
  }, [open]);

  // Atualizar array de valores quando número de parcelas muda
  const updateInstallmentValues = (numInstallments: string) => {
    const num = parseInt(numInstallments) || 1;
    const newValues = Array(num).fill("").map((_, index) => 
      installmentValues[index] || ""
    );
    setInstallmentValues(newValues);
  };

  const resetForm = () => {
    setClientId("");
    setDescription("");
    setAmount("");
    setPaymentMethod('pix');
    setInstallments("1");
    setInstallmentsForClosed("1");
    setInstallmentValues([""]);
    setDueDate(new Date().toISOString().split('T')[0]);
    setPaymentType('onetime');
    setStatus('pending');
    setPaymentDate("");
    setPayOnDelivery(false);
    setIsMeasuredMonthly(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação: não exigir valor quando "valor medido mensalmente" estiver ativo
    if (!clientId || !description || (!isMeasuredMonthly && !amount) || !dueDate) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validar payment_date se status for 'paid' (exceto quando for Pagamento por entrega)
    if (status === 'paid' && !paymentDate && !payOnDelivery) {
      toast({
        title: "Erro",
        description: "Informe a data de pagamento ou marque 'Pagamento por entrega' ao definir como Pago",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Usar valor 0 quando "valor medido mensalmente" estiver ativo
      const amountValue = isMeasuredMonthly ? 0 : parseFloat(amount);
      
      if (!isMeasuredMonthly && (isNaN(amountValue) || amountValue <= 0)) {
        toast({
          title: "Erro",
          description: "O valor deve ser maior que zero.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Variável para armazenar número de parcelas para mensagem de sucesso
      let finalInstallmentsCount = 1;

      if (paymentType === 'onetime') {
        // Create closed scope payment(s) - pode ser uma ou múltiplas parcelas
        const installmentsClosedValue = parseInt(installmentsForClosed);
        finalInstallmentsCount = installmentsClosedValue;
        
        if (isNaN(installmentsClosedValue) || installmentsClosedValue < 1) {
          toast({
            title: "Erro",
            description: "O número de parcelas deve ser pelo menos 1.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        if (installmentsClosedValue === 1) {
          // Pagamento único
          const { error } = await supabase
            .from('payments')
            .insert({
              client_id: clientId,
              description,
              amount: amountValue,
              due_date: dueDate,
              payment_method: paymentMethod,
              status: status,
              payment_date: payOnDelivery ? null : (paymentDate || null),
              Pagamento_Por_Entrega: payOnDelivery,
              scope_type: 'closed'
            });

          if (error) {
            throw error;
          }
        } else {
          // Múltiplas parcelas de escopo fechado com valores individuais
          const baseDate = new Date(dueDate);
          
          // Validar se todos os valores foram preenchidos
          const hasEmptyValues = installmentValues.some(value => !value || parseFloat(value) <= 0);
          if (hasEmptyValues) {
            toast({
              title: "Erro",
              description: "Todos os valores das parcelas devem ser preenchidos e maiores que zero.",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
          
          const paymentsToInsert = [];
          
          for (let i = 1; i <= installmentsClosedValue; i++) {
            const installmentDueDate = new Date(baseDate);
            installmentDueDate.setMonth(installmentDueDate.getMonth() + (i - 1));
            const installmentAmount = parseFloat(installmentValues[i - 1]);
            
            paymentsToInsert.push({
              client_id: clientId,
              description: `${description} (${i}/${installmentsClosedValue})`,
              amount: installmentAmount,
              due_date: installmentDueDate.toISOString().split('T')[0],
              payment_method: paymentMethod,
              status: 'pending',
              installment_number: i,
              total_installments: installmentsClosedValue,
              Pagamento_Por_Entrega: payOnDelivery,
              scope_type: 'closed',
            });
          }

          const { error } = await supabase
            .from('payments')
            .insert(paymentsToInsert);

          if (error) {
            throw error;
          }
        }
      } else {
        // Create an open scope billing (recurring) - same logic as closed scope for multiple installments
        const installmentsValue = parseInt(installments);
        
        if (isNaN(installmentsValue) || installmentsValue < 1) {
          toast({
            title: "Erro",
            description: "O número de parcelas deve ser pelo menos 1.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        if (installmentsValue === 1) {
          // Single payment
          const { error } = await supabase
            .from('payments')
            .insert({
              client_id: clientId,
              description,
              amount: amountValue,
              payment_method: paymentMethod,
              due_date: dueDate,
              status: 'pending',
              scope_type: 'open'
            });

          if (error) {
            throw error;
          }
        } else {
          // Multiple installments for open scope
          const baseDate = new Date(dueDate);
          const installmentAmount = amountValue / installmentsValue;
          
          const paymentsToInsert = [];
          
          for (let i = 1; i <= installmentsValue; i++) {
            const installmentDueDate = new Date(baseDate);
            installmentDueDate.setMonth(installmentDueDate.getMonth() + (i - 1));
            
            paymentsToInsert.push({
              client_id: clientId,
              description: `${description} (${i}/${installmentsValue})`,
              amount: installmentAmount,
              due_date: installmentDueDate.toISOString().split('T')[0],
              payment_method: paymentMethod,
              status: 'pending',
              installment_number: i,
              total_installments: installmentsValue,
              Pagamento_Por_Entrega: payOnDelivery,
              scope_type: 'open',
            });
          }

          const { error } = await supabase
            .from('payments')
            .insert(paymentsToInsert);

          if (error) {
            throw error;
          }
        }
      }

      const successMessage = paymentType === 'onetime' 
        ? (finalInstallmentsCount > 1 
          ? `Recebimento de escopo fechado criado com ${finalInstallmentsCount} parcelas.`
          : 'Recebimento de escopo fechado criado com sucesso.')
        : 'Recebimento de escopo aberto criado com sucesso.';

      toast({
        title: "Sucesso",
        description: successMessage,
      });
      
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao criar recebimento:", error);
      toast({
        title: "Erro",
        description: `Não foi possível criar o recebimento. ${error.message || ""}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isSubmitting && !isOpen) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Recebimento</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <Tabs value={paymentType} onValueChange={(value) => setPaymentType(value as 'recurring' | 'onetime')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="onetime">Escopo Fechado</TabsTrigger>
                <TabsTrigger value="recurring">Escopo Aberto</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-4 mt-4">
              <div>
                <Label>Cliente</Label>
                <ClientSelector
                  clients={safeClients}
                  onSelect={setClientId}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição do recebimento"
                  disabled={isSubmitting}
                  required
                />
              </div>


              <div className="grid gap-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  disabled={isSubmitting || isMeasuredMonthly}
                  required={!isMeasuredMonthly}
                />
                
                {paymentType === 'recurring' && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox 
                      id="measured-monthly"
                      checked={isMeasuredMonthly}
                      onCheckedChange={setIsMeasuredMonthly}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="measured-monthly" className="text-sm text-muted-foreground">
                      Valor medido mensalmente (não fixo)
                    </Label>
                  </div>
                )}
              </div>

              {paymentType === 'onetime' && (
                <div className="grid gap-2">
                  <Label htmlFor="installments_closed">Parcelas</Label>
                  <Input
                    id="installments_closed"
                    type="number"
                    min="1"
                    value={installmentsForClosed}
                    onChange={(e) => {
                      setInstallmentsForClosed(e.target.value);
                      updateInstallmentValues(e.target.value);
                    }}
                    placeholder="1"
                    disabled={isSubmitting}
                    required
                  />
                  {installmentsForClosed === "1" ? (
                    <p className="text-sm text-muted-foreground">Pagamento único</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Configure o valor de cada parcela:
                      </p>
                      {installmentValues.map((value, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Label className="text-sm min-w-[60px]">
                            {index + 1}ª parcela:
                          </Label>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={value}
                            onChange={(e) => {
                              const newValues = [...installmentValues];
                              newValues[index] = e.target.value;
                              setInstallmentValues(newValues);
                            }}
                            placeholder="0,00"
                            disabled={isSubmitting}
                            required
                            className="flex-1"
                          />
                        </div>
                      ))}
                      <div className="flex items-center gap-2 mt-3 p-2 border rounded">
                        <Checkbox
                          id="pay_on_delivery_multiple"
                          checked={payOnDelivery}
                          onCheckedChange={(checked) => setPayOnDelivery(Boolean(checked))}
                        />
                        <Label htmlFor="pay_on_delivery_multiple" className="text-sm">
                          Todas as parcelas são pagamento por entrega
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {paymentType === 'recurring' && (
                <div className="grid gap-2">
                  <Label htmlFor="installments">Parcelas</Label>
                  <Input
                    id="installments"
                    type="number"
                    min="1"
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value)}
                    placeholder="1"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="due_date">
                  {paymentType === 'recurring' ? 'Data de início' : (installmentsForClosed === "1" ? 'Data de vencimento' : 'Data da primeira parcela')}
                </Label>
                <Input
                  id="due_date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <PaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                disabled={isSubmitting}
              />

              {paymentType === 'onetime' && installmentsForClosed === "1" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={(value: 'pending' | 'paid') => setStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="payment_date">
                      Data de Pagamento
                      {status === 'paid' && !payOnDelivery && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="pay_on_delivery"
                        checked={payOnDelivery}
                        onCheckedChange={(checked) => {
                          const value = Boolean(checked);
                          setPayOnDelivery(value);
                          if (value) setPaymentDate("");
                        }}
                      />
                      <Label htmlFor="pay_on_delivery" className="text-sm">Pagamento por entrega</Label>
                    </div>
                    {payOnDelivery ? (
                      <Input
                        value="Pagamento na entrega"
                        readOnly
                        disabled
                      />
                    ) : (
                      <Input
                        id="payment_date"
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        disabled={isSubmitting}
                        required={status === 'paid' && !payOnDelivery}
                      />
                    )}
                    {status === 'paid' && !payOnDelivery && !paymentDate && (
                      <p className="text-sm text-red-500">Data de pagamento é obrigatória quando status é "Pago"</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
