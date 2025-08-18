import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Contract } from "@/types/contract";
import { useContracts } from "@/hooks/useContracts";
import { formatCurrency } from "@/components/payments/utils/formatUtils";
import { CalendarIcon, CheckIcon } from "lucide-react";

interface SignContractDialogProps {
  contract: Contract;
  open: boolean;
  onClose: () => void;
}

export function SignContractDialog({ contract, open, onClose }: SignContractDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentType, setPaymentType] = useState<"pontual" | "recorrente">("pontual");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "boleto" | "credit_card">("pix");
  const [signingDate, setSigningDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDay, setDueDay] = useState(5);
  const [pagamentoPorEntrega, setPagamentoPorEntrega] = useState(false);
  
  const { toast } = useToast();
  const { updateContract } = useContracts();

  const handleSubmit = async () => {
    if (!contract.client_id || !contract.total_value || !contract.installments) {
      toast({
        title: "Erro",
        description: "Contrato deve ter cliente, valor total e número de parcelas definidos.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Atualizar o status do contrato para "completed" e data de assinatura
      await updateContract(contract.id, {
        status: "completed",
        data_de_assinatura: new Date(signingDate).toISOString(),
      });

      // 2. Criar os recebimentos
      if (paymentType === "pontual") {
        // Criar um único pagamento
        const { error: paymentError } = await supabase
          .from("payments")
          .insert({
            client_id: contract.client_id,
            description: `Contrato: ${contract.scope || `Contrato #${contract.id}`}`,
            amount: contract.total_value,
            due_date: dueDate,
            payment_method: paymentMethod,
            status: "pending",
            Pagamento_Por_Entrega: pagamentoPorEntrega,
          });

        if (paymentError) throw paymentError;
      } else {
        // Criar recebimento recorrente
        const startDate = new Date(dueDate);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + (contract.installments - 1));

        const { error: recurringError } = await supabase
          .from("recurring_billing")
          .insert({
            client_id: contract.client_id,
            description: `Contrato: ${contract.scope || `Contrato #${contract.id}`}`,
            amount: contract.installment_value || (contract.total_value / contract.installments),
            due_day: dueDay,
            payment_method: paymentMethod,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            installments: contract.installments,
            status: "pending",
          });

        if (recurringError) throw recurringError;
      }

      toast({
        title: "Contrato assinado!",
        description: `Contrato marcado como assinado e ${paymentType === "pontual" ? "pagamento" : "recebimento recorrente"} criado com sucesso.`,
      });

      onClose();
    } catch (error: any) {
      console.error("Error signing contract:", error);
      toast({
        title: "Erro ao assinar contrato",
        description: error.message || "Não foi possível assinar o contrato.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const installmentValue = contract.installment_value || (contract.total_value && contract.installments ? contract.total_value / contract.installments : 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckIcon className="h-5 w-5 text-green-600" />
            Marcar Contrato como Assinado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do contrato */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h3 className="font-medium">Informações do Contrato</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Cliente:</span>
                <p className="font-medium">{contract.clients?.name || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Escopo:</span>
                <p className="font-medium">{contract.scope || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Valor Total:</span>
                <p className="font-medium">{contract.total_value ? formatCurrency(contract.total_value) : "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Parcelas:</span>
                <p className="font-medium">{contract.installments || "1"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Valor por Parcela:</span>
                <p className="font-medium">{installmentValue ? formatCurrency(installmentValue) : "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Data de assinatura */}
          <div className="space-y-2">
            <Label htmlFor="signingDate">Data de Assinatura</Label>
            <Input
              id="signingDate"
              type="date"
              value={signingDate}
              onChange={(e) => setSigningDate(e.target.value)}
            />
          </div>

          {/* Tipo de recebimento */}
          <div className="space-y-3">
            <Label>Tipo de Recebimento</Label>
            <Select value={paymentType} onValueChange={(value: "pontual" | "recorrente") => setPaymentType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pontual">Pagamento Único</SelectItem>
                <SelectItem value="recorrente">Recebimento Recorrente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Configurações de pagamento */}
          <div className="space-y-4">
            {paymentType === "pontual" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Data de Vencimento</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pagamentoPorEntrega"
                    checked={pagamentoPorEntrega}
                    onCheckedChange={(checked) => setPagamentoPorEntrega(!!checked)}
                  />
                  <Label htmlFor="pagamentoPorEntrega">Pagamento por entrega</Label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDay">Dia de Vencimento</Label>
                  <Select value={dueDay.toString()} onValueChange={(value) => setDueDay(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          Dia {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={(value: "pix" | "boleto" | "credit_card") => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Processando..." : "Marcar como Assinado"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}