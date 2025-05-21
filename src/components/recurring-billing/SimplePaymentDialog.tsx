
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientSelector } from "./ClientSelector";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  clients 
}: SimplePaymentDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentType, setPaymentType] = useState<'recurring' | 'onetime'>('onetime');
  
  // Form data
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto' | 'credit_card'>('pix');
  const [installments, setInstallments] = useState("1");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  
  const resetForm = () => {
    setClientId("");
    setDescription("");
    setAmount("");
    setPaymentMethod('pix');
    setInstallments("1");
    setDueDate(new Date().toISOString().split('T')[0]);
    setPaymentType('onetime');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId || !description || !amount || !dueDate) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const amountValue = parseFloat(amount);
      
      if (isNaN(amountValue) || amountValue <= 0) {
        toast({
          title: "Erro",
          description: "O valor deve ser maior que zero.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (paymentType === 'onetime') {
        // Create a one-time payment
        const { error } = await supabase
          .from('payments')
          .insert({
            client_id: clientId,
            description,
            amount: amountValue,
            due_date: dueDate,
            payment_method: paymentMethod,
            status: 'pending'
          });

        if (error) {
          throw error;
        }
      } else {
        // Create a recurring payment
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

        // Extract the day from the due date for recurring billing
        const dueDay = new Date(dueDate).getDate();
        
        const { error } = await supabase
          .from('recurring_billing')
          .insert({
            client_id: clientId,
            description,
            amount: amountValue,
            payment_method: paymentMethod,
            due_day: dueDay,
            installments: installmentsValue,
            start_date: dueDate,
            current_installment: 0,
            status: 'pending'
          });

        if (error) {
          throw error;
        }
      }

      toast({
        title: "Sucesso",
        description: `Recebimento ${paymentType === 'onetime' ? 'pontual' : 'recorrente'} criado com sucesso.`,
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

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Tabs value={paymentType} onValueChange={(value) => setPaymentType(value as 'recurring' | 'onetime')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="onetime">Pontual</TabsTrigger>
              <TabsTrigger value="recurring">Recorrente</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Cliente</Label>
              <ClientSelector
                clients={clients || []}
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
                disabled={isSubmitting}
                required
              />
            </div>

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
                {paymentType === 'recurring' ? 'Data de início' : 'Data de vencimento'}
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
      </DialogContent>
    </Dialog>
  );
}
