import { useState, useEffect } from "react";
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
import { useWebhooks } from "@/hooks/useWebhooks";

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
  const [linkContratoExterno, setLinkContratoExterno] = useState(contract.link_contrato_externo || "");
  const { getWebhook } = useWebhooks();
  
  // Estados para valores editáveis
  const [singlePaymentAmount, setSinglePaymentAmount] = useState(contract.total_value || 0);
  const [installmentCount, setInstallmentCount] = useState(contract.installments || 1);
  const [installmentValues, setInstallmentValues] = useState<number[]>(() => {
    const defaultValue = contract.installment_value || (contract.total_value && contract.installments ? contract.total_value / contract.installments : 0);
    return Array(contract.installments || 1).fill(defaultValue);
  });
  const [installmentDates, setInstallmentDates] = useState<string[]>(() => {
    const today = new Date();
    return Array(contract.installments || 1).fill(0).map((_, index) => {
      const date = new Date(today);
      date.setMonth(date.getMonth() + index);
      return date.toISOString().split('T')[0];
    });
  });
  // Array para controlar pagamento por entrega de cada parcela individualmente
  const [pagamentoPorEntregaParcelas, setPagamentoPorEntregaParcelas] = useState<boolean[]>(() => {
    return Array(contract.installments || 1).fill(false);
  });
  
  const { toast } = useToast();
  const { updateContract } = useContracts();

  // Resetar estados quando o dialog abrir ou o contrato mudar
  useEffect(() => {
    if (open && contract) {
      setLinkContratoExterno(contract.link_contrato_externo || "");
      setInstallmentCount(contract.installments || 1);
      const defaultValue = contract.installment_value || (contract.total_value && contract.installments ? contract.total_value / contract.installments : 0);
      setInstallmentValues(Array(contract.installments || 1).fill(defaultValue));
      const today = new Date();
      setInstallmentDates(Array(contract.installments || 1).fill(0).map((_, index) => {
        const date = new Date(today);
        date.setMonth(date.getMonth() + index);
        return date.toISOString().split('T')[0];
      }));
      setPagamentoPorEntregaParcelas(Array(contract.installments || 1).fill(false));
      setSinglePaymentAmount(contract.total_value || 0);
      setPagamentoPorEntrega(false);
    }
  }, [open, contract]);

  // Funções auxiliares
  const updateInstallmentValue = (index: number, value: number) => {
    const newValues = [...installmentValues];
    newValues[index] = value;
    setInstallmentValues(newValues);
  };

  const updateInstallmentDate = (index: number, date: string) => {
    const newDates = [...installmentDates];
    newDates[index] = date;
    setInstallmentDates(newDates);
  };

  const updateInstallmentCount = (newCount: number) => {
    setInstallmentCount(newCount);
    if (newCount > installmentValues.length) {
      // Adicionar novas parcelas com valor padrão
      const defaultValue = contract.installment_value || (contract.total_value && contract.installments ? contract.total_value / contract.installments : 0);
      const newValues = [...installmentValues, ...Array(newCount - installmentValues.length).fill(defaultValue)];
      setInstallmentValues(newValues);
      
      // Adicionar novas datas baseadas na última data
      const lastDate = installmentDates[installmentDates.length - 1] || new Date().toISOString().split('T')[0];
      const newDates = [...installmentDates];
      for (let i = installmentDates.length; i < newCount; i++) {
        const date = new Date(lastDate);
        date.setMonth(date.getMonth() + i - installmentDates.length + 1);
        newDates.push(date.toISOString().split('T')[0]);
      }
      setInstallmentDates(newDates);
      
      // Adicionar novos estados de pagamento por entrega (false por padrão)
      const newPagamentoPorEntrega = [...pagamentoPorEntregaParcelas, ...Array(newCount - pagamentoPorEntregaParcelas.length).fill(false)];
      setPagamentoPorEntregaParcelas(newPagamentoPorEntrega);
    } else {
      // Remover parcelas e datas extras
      setInstallmentValues(installmentValues.slice(0, newCount));
      setInstallmentDates(installmentDates.slice(0, newCount));
      setPagamentoPorEntregaParcelas(pagamentoPorEntregaParcelas.slice(0, newCount));
    }
  };

  const updatePagamentoPorEntregaParcela = (index: number, checked: boolean) => {
    const newPagamentoPorEntrega = [...pagamentoPorEntregaParcelas];
    newPagamentoPorEntrega[index] = checked;
    setPagamentoPorEntregaParcelas(newPagamentoPorEntrega);
    
    // Se marcar como pagamento por entrega, limpar a data dessa parcela
    if (checked) {
      const newDates = [...installmentDates];
      newDates[index] = "";
      setInstallmentDates(newDates);
    }
  };

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
      // 1. Atualizar o status do contrato para "completed", data de assinatura e link externo
      await updateContract(contract.id, {
        status: "completed",
        data_de_assinatura: new Date(signingDate).toISOString(),
        link_contrato_externo: linkContratoExterno || null,
      });

      // 2. Criar os recebimentos
      if (paymentType === "pontual") {
        // Criar um único pagamento
        const { error: paymentError } = await supabase
          .from("payments")
          .insert({
            client_id: contract.client_id,
            description: `Contrato: ${contract.scope || `Contrato #${contract.id}`}`,
            amount: singlePaymentAmount,
            due_date: pagamentoPorEntrega ? null : (dueDate || null), // null se for pagamento por entrega
            payment_method: paymentMethod,
            status: "pending",
            Pagamento_Por_Entrega: pagamentoPorEntrega,
          });

        if (paymentError) throw paymentError;
      } else {
        // Criar parcelas individuais baseadas nos valores e datas editados
        const paymentsToInsert = installmentValues.slice(0, installmentCount).map((amount, index) => ({
          client_id: contract.client_id,
          description: `Contrato: ${contract.scope || `Contrato #${contract.id}`} (${index + 1}/${installmentCount})`,
          amount: amount,
          due_date: pagamentoPorEntregaParcelas[index] ? null : (installmentDates[index] || null), // null se essa parcela for pagamento por entrega
          payment_method: paymentMethod,
          status: "pending" as const,
          installment_number: index + 1,
          total_installments: installmentCount,
          Pagamento_Por_Entrega: pagamentoPorEntregaParcelas[index] || false, // Cada parcela tem sua própria opção
        }));

        const { error: paymentsError } = await supabase
          .from("payments")
          .insert(paymentsToInsert);

        if (paymentsError) throw paymentsError;
      }

      // 3. Enviar dados para o webhook
      try {
        // Buscar webhook dinâmico de assinatura - DIRETO DO LOCALSTORAGE
        const webhookUrl = localStorage.getItem('prestacao_servico_assinatura_webhook');
        
        console.log('🔍 URL do webhook de assinatura (localStorage):', webhookUrl);
        
        if (webhookUrl) {
          // Estruturar todos os dados do contrato atualizado
          const contractData = {
            ...contract,
            status: "completed",
            data_de_assinatura: new Date(signingDate).toISOString(),
            payment_type: paymentType,
            payment_method: paymentMethod,
          };

          const webhookData = {
            contract: contractData,
            client: {
              id: contract.client_id,
              name: contract.clients?.name,
              email: contract.clients?.email,
              type: contract.clients?.type,
            },
            payment_details: paymentType === "pontual" 
              ? {
                  amount: singlePaymentAmount,
                  due_date: dueDate,
                  pagamento_por_entrega: pagamentoPorEntrega,
                }
              : {
                  installment_count: installmentCount,
                  installments: installmentValues.slice(0, installmentCount).map((amount, index) => ({
                    number: index + 1,
                    amount: amount,
                    due_date: installmentDates[index],
                  })),
                },
            webhook_url: webhookUrl
          };

          console.log('Enviando webhook de assinatura:', webhookUrl);
          
          // CHAMAR WEBHOOK DIRETAMENTE - SEM EDGE FUNCTION
          const webhookParams = new URLSearchParams();
          webhookParams.append('action', 'sign_contract');
          webhookParams.append('timestamp', new Date().toISOString());
          webhookParams.append('contract_id', contract.id.toString());
          webhookParams.append('contract_status', 'completed');
          webhookParams.append('client_name', contract.clients?.name || '');
          webhookParams.append('contract_scope', contract.scope || '');
          webhookParams.append('total_value', contract.total_value?.toString() || '');
          webhookParams.append('payment_type', paymentType);
          webhookParams.append('payment_method', paymentMethod);
          
          const finalWebhookUrl = `${webhookUrl}?${webhookParams}`;
          console.log('🎯 URL FINAL DO WEBHOOK:', finalWebhookUrl);

          try {
            const webhookResponse = await fetch(finalWebhookUrl, {
              method: 'GET',
              mode: 'no-cors', // Para evitar problemas de CORS
            });
            console.log('✅ Webhook chamado diretamente com sucesso');
          } catch (webhookError) {
            console.warn('⚠️ Erro ao chamar webhook, mas continuando:', webhookError);
            // Não falhar o processo se o webhook falhar
          }
        } else {
          console.warn('Webhook de assinatura não configurado, pulando chamada');
          toast({
            title: "Webhook não configurado",
            description: "Configure o webhook de assinatura nas configurações da página",
            variant: "destructive",
          });
        }

        console.log('Contract webhook sent successfully');
      } catch (webhookError) {
        console.error('Error sending contract webhook:', webhookError);
        toast({
          title: "Aviso",
          description: "Contrato assinado, mas houve problema ao chamar o webhook.",
          variant: "destructive",
        });
        // Não falhar o processo principal se o webhook falhar
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

          {/* Link do contrato externo */}
          <div className="space-y-2">
            <Label htmlFor="linkContratoExterno">Link do Contrato Externo (Opcional)</Label>
            <Input
              id="linkContratoExterno"
              type="url"
              value={linkContratoExterno}
              onChange={(e) => setLinkContratoExterno(e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              Link para um contrato externo (ex: DocuSign, Adobe Sign, etc.)
            </p>
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
                  <Label htmlFor="singleAmount">Valor do Pagamento</Label>
                  <Input
                    id="singleAmount"
                    type="number"
                    step="0.01"
                    value={singlePaymentAmount}
                    onChange={(e) => setSinglePaymentAmount(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Data de Vencimento</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={pagamentoPorEntrega}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pagamentoPorEntrega"
                    checked={pagamentoPorEntrega}
                    onCheckedChange={(checked) => {
                      setPagamentoPorEntrega(!!checked);
                      if (checked) {
                        setDueDate("");
                      }
                    }}
                  />
                  <Label htmlFor="pagamentoPorEntrega">Pagamento por entrega</Label>
                </div>
                {pagamentoPorEntrega && (
                  <p className="text-xs text-muted-foreground">
                    Data de vencimento será definida no momento da entrega.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="installmentCount">Número de Parcelas</Label>
                  <Input
                    id="installmentCount"
                    type="number"
                    min="1"
                    value={installmentCount}
                    onChange={(e) => updateInstallmentCount(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Parcelas e Datas de Vencimento</Label>
                  <div className="max-h-60 overflow-y-auto space-y-3">
                    {installmentValues.slice(0, installmentCount).map((value, index) => (
                      <div key={index} className="space-y-2 border rounded-lg p-3 bg-muted/30">
                        <Label className="text-sm font-medium">
                          {index + 1}ª Parcela
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Valor</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={value}
                              onChange={(e) => updateInstallmentValue(index, Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Vencimento</Label>
                            <Input
                              type="date"
                              value={installmentDates[index] || new Date().toISOString().split('T')[0]}
                              onChange={(e) => updateInstallmentDate(index, e.target.value)}
                              disabled={pagamentoPorEntregaParcelas[index]} // Desabilitar apenas se essa parcela específica for pagamento por entrega
                            />
                          </div>
                        </div>
                        
                        {/* Checkbox individual para cada parcela */}
                        <div className="flex items-center space-x-2 mt-2">
                          <Checkbox
                            id={`pagamentoPorEntrega-${index}`}
                            checked={pagamentoPorEntregaParcelas[index] || false}
                            onCheckedChange={(checked) => updatePagamentoPorEntregaParcela(index, !!checked)}
                          />
                          <Label htmlFor={`pagamentoPorEntrega-${index}`} className="text-xs">
                            Pagamento por entrega
                          </Label>
                        </div>
                        {pagamentoPorEntregaParcelas[index] && (
                          <p className="text-xs text-muted-foreground">
                            Data de vencimento será definida no momento da entrega.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
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