
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight, Type, Plus, Trash2, Calendar, DollarSign } from "lucide-react";
import { useContracts } from "@/hooks/useContracts";
import { useWebhooks } from "@/hooks/useWebhooks";
import { useToast } from "@/hooks/use-toast";
import { Contract } from "@/types/contract";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface EditContractDialogProps {
  contract: Contract;
  open: boolean;
  onClose: () => void;
}

interface InstallmentDetail {
  number: number;
  amount: number;
  dueDate: string;
  description?: string;
  paid?: boolean;
}

export function EditContractDialog({ contract, open, onClose }: EditContractDialogProps) {
  const { updateContract } = useContracts();
  const { getWebhook } = useWebhooks();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Rich text editor functions
  const applyFormatting = (format: string) => {
    const textarea = document.getElementById('texto_contrato') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let formattedText = '';

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      default:
        formattedText = selectedText;
    }

    const newText = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    setFormData({ ...formData, texto_contrato: newText });

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  // Font styles
  const getFontStyle = (fontFamily: string) => {
    switch (fontFamily) {
      case 'serif':
        return { fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' };
      case 'sans':
        return { fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' };
      case 'mono':
        return { fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' };
      default:
        return { fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' };
    }
  };
  const [formData, setFormData] = useState({
    scope: "",
    projeto_relacionado: "",
    total_value: "",
    installments: "",
    installment_value_text: "",
    start_date: "",
    end_date: "",
    status: "active" as "active" | "completed" | "cancelled" | "suspended",
    contract_type: "closed_scope" as "open_scope" | "closed_scope" | "NDA",
    contractor_type: "individual" as "individual" | "legal_entity",
    data_de_assinatura: "",
    link_contrato: "",
    obs: "",
    Horas: "",
    correcoes_texto: "",
    texto_contrato: "",
    fontFamily: "mono",
  });

  const [installmentDetails, setInstallmentDetails] = useState<InstallmentDetail[]>([]);
  const [showAdvancedInstallments, setShowAdvancedInstallments] = useState(false);

  useEffect(() => {
    if (contract) {
      setFormData({
        scope: contract.scope || "",
        projeto_relacionado: contract.projeto_relacionado || "",
        total_value: contract.total_value?.toString() || "",
        installments: contract.installments?.toString() || "",
        installment_value_text: contract.installment_value_text || "",
        start_date: contract.start_date || "",
        end_date: contract.end_date || "",
        status: contract.status || "active",
        contract_type: contract.contract_type || "closed_scope",
        contractor_type: contract.contractor_type || "individual",
        data_de_assinatura: contract.data_de_assinatura || "",
        link_contrato: contract.link_contrato || "",
        obs: contract.obs || "",
        Horas: contract.Horas || "",
        correcoes_texto: "",
        texto_contrato: contract.texto_contrato || "",
        fontFamily: "mono",
      });

      // Carregar parcelas detalhadas se existirem
      if (contract.installment_details) {
        try {
          const details: InstallmentDetail[] = JSON.parse(contract.installment_details);
          setInstallmentDetails(details);
          if (details.length > 0) {
            setShowAdvancedInstallments(true);
          }
        } catch (error) {
          console.error("Erro ao parsear installment_details:", error);
          setInstallmentDetails([]);
        }
      } else {
        setInstallmentDetails([]);
      }
    }
  }, [contract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.scope || !formData.total_value) {
      return;
    }

    setLoading(true);
    try {
      const totalValue = parseFloat(formData.total_value);
      const installments = parseInt(formData.installments) || 1;
      const installmentValue = totalValue / installments;

      const updatedData = {
        scope: formData.scope,
        total_value: totalValue,
        installments: installments,
        installment_value: installmentValue,
        installment_value_text: formData.installment_value_text || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        status: formData.status,
        contract_type: formData.contract_type,
        contractor_type: formData.contractor_type,
        data_de_assinatura: formData.data_de_assinatura || undefined,
        link_contrato: formData.link_contrato || undefined,
        obs: formData.obs || undefined,
        Horas: formData.contract_type === "open_scope" && formData.Horas ? formData.Horas : undefined,
        // Adicionar informações detalhadas das parcelas se disponíveis
        installment_details: installmentDetails.length > 0 ? JSON.stringify(installmentDetails) : undefined,
        // NÃO incluir texto_contrato no update do banco
      };

      await updateContract(contract.id, updatedData);

      // Disparar webhook de edição se configurado
      const webhookUrl = getWebhook('prestacao_servico', 'edicao');

      if (webhookUrl && webhookUrl.trim() !== '') {
        try {
          console.log('Disparando webhook de edição:', webhookUrl);

          // Preparar parâmetros para GET request
          const webhookParams = new URLSearchParams();

          // Campos básicos obrigatórios
          webhookParams.append('action', 'edit_contract');
          webhookParams.append('timestamp', new Date().toISOString());
          webhookParams.append('contract_id', contract.id.toString());

          // Todos os campos editados do contrato
          Object.entries(updatedData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              webhookParams.append(key, value.toString());
            }
          });

          // Adicionar texto de correções se preenchido
          if (formData.correcoes_texto && formData.correcoes_texto.trim() !== '') {
            webhookParams.append('correcoes_texto', formData.correcoes_texto);
          }

          // Adicionar texto original (do banco) e texto corrigido (editado)
          webhookParams.append('texto_contrato', contract.texto_contrato || ''); // Versão ATUAL do banco

          if (formData.texto_contrato && formData.texto_contrato.trim() !== '') {
            webhookParams.append('texto_corrigido', formData.texto_contrato); // Versão NOVA editada
          }

          const webhookResponse = await fetch(`${webhookUrl}?${webhookParams}`, {
            method: "GET",
          });

          if (webhookResponse.ok) {
            toast({
              title: "Webhook enviado",
              description: "O webhook foi chamado com sucesso para a edição do contrato.",
            });
          } else {
            throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
          }
        } catch (error) {
          console.error("Erro ao chamar webhook:", error);
          toast({
            title: "Aviso",
            description: "Contrato editado, mas houve problema ao chamar o webhook.",
            variant: "destructive",
          });
        }
      } else {
        console.log('Nenhum webhook configurado para edição de contrato');
      }

      onClose();
    } catch (error) {
      console.error("Error updating contract:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calcula automaticamente o valor da parcela quando o valor total ou número de parcelas muda
  const calculateInstallmentValue = () => {
    const total = parseFloat(formData.total_value) || 0;
    const installments = parseInt(formData.installments) || 1;
    return total / installments;
  };

  // Gera parcelas detalhadas baseadas no valor total e número de parcelas
  const generateInstallmentDetails = () => {
    const totalValue = parseFloat(formData.total_value) || 0;
    const installments = parseInt(formData.installments) || 1;
    const installmentValue = totalValue / installments;
    const startDate = formData.start_date ? new Date(formData.start_date) : new Date();

    const details: InstallmentDetail[] = [];

    for (let i = 1; i <= installments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + (i - 1));

      details.push({
        number: i,
        amount: installmentValue,
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Parcela ${i}/${installments}`,
        paid: false
      });
    }

    setInstallmentDetails(details);
  };

  // Atualiza uma parcela específica
  const updateInstallmentDetail = (index: number, field: keyof InstallmentDetail, value: any) => {
    const updated = [...installmentDetails];
    updated[index] = { ...updated[index], [field]: value };
    setInstallmentDetails(updated);
  };

  // Adiciona uma nova parcela
  const addInstallment = () => {
    const newInstallment: InstallmentDetail = {
      number: installmentDetails.length + 1,
      amount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      description: `Parcela ${installmentDetails.length + 1}`,
      paid: false
    };
    setInstallmentDetails([...installmentDetails, newInstallment]);
    setFormData({ ...formData, installments: (installmentDetails.length + 1).toString() });
  };

  // Remove uma parcela
  const removeInstallment = (index: number) => {
    const updated = installmentDetails.filter((_, i) => i !== index);
    // Renumera as parcelas
    const renumbered = updated.map((inst, i) => ({
      ...inst,
      number: i + 1,
      description: inst.description?.includes('Parcela') ? `Parcela ${i + 1}` : inst.description
    }));
    setInstallmentDetails(renumbered);
    setFormData({ ...formData, installments: renumbered.length.toString() });
  };

  // Recalcula o valor total baseado nas parcelas detalhadas
  const recalculateTotalFromInstallments = () => {
    const total = installmentDetails.reduce((sum, inst) => sum + inst.amount, 0);
    setFormData({ ...formData, total_value: total.toString() });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Contrato</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scope">Escopo *</Label>
            <Textarea
              id="scope"
              required
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              placeholder="Descreva o escopo do contrato"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projeto_relacionado">Projeto Relacionado</Label>
            <Input
              id="projeto_relacionado"
              value={formData.projeto_relacionado}
              onChange={(e) => setFormData({ ...formData, projeto_relacionado: e.target.value })}
              placeholder="Nome do projeto que será criado automaticamente"
            />
            <p className="text-sm text-muted-foreground">
              Este será o nome do projeto criado automaticamente. Se vazio, será usado o escopo.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_value">Valor Total *</Label>
              <Input
                id="total_value"
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.total_value}
                onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installments">Número de Parcelas</Label>
              <Input
                id="installments"
                type="number"
                min="1"
                value={formData.installments}
                onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installment_value_text">Descrição das Parcelas</Label>
              <Input
                id="installment_value_text"
                value={formData.installment_value_text}
                onChange={(e) => setFormData({ ...formData, installment_value_text: e.target.value })}
                placeholder="Ex: 3x de R$ 1.000,00 ou 12x de R$ 500,00"
              />
              <div className="text-sm text-muted-foreground">
                Valor calculado: R$ {calculateInstallmentValue().toFixed(2)}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedInstallments(!showAdvancedInstallments)}
                className="w-full"
              >
                {showAdvancedInstallments ? "Ocultar" : "Editar"} Parcelas Detalhadamente
              </Button>
            </div>
          </div>

          <Collapsible open={showAdvancedInstallments}>
            <CollapsibleContent className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Gestão Detalhada de Parcelas
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateInstallmentDetails}
                      >
                        Gerar Parcelas Automaticamente
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addInstallment}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Parcela
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {installmentDetails.length > 0 ? (
                    <>
                      {installmentDetails.map((installment, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Parcela {installment.number}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeInstallment(index)}
                              disabled={installmentDetails.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-2">
                              <Label>Valor</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={installment.amount}
                                onChange={(e) => updateInstallmentDetail(index, 'amount', parseFloat(e.target.value) || 0)}
                                placeholder="0,00"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Data de Vencimento</Label>
                              <Input
                                type="date"
                                value={installment.dueDate}
                                onChange={(e) => updateInstallmentDetail(index, 'dueDate', e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Descrição</Label>
                              <Input
                                value={installment.description || ''}
                                onChange={(e) => updateInstallmentDetail(index, 'description', e.target.value)}
                                placeholder="Descrição da parcela"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Status</Label>
                              <Select
                                value={installment.paid ? "paid" : "pending"}
                                onValueChange={(value) => updateInstallmentDetail(index, 'paid', value === "paid")}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pendente</SelectItem>
                                  <SelectItem value="paid">Paga</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">Total das Parcelas: R$ {installmentDetails.reduce((sum, inst) => sum + inst.amount, 0).toFixed(2)}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={recalculateTotalFromInstallments}
                        >
                          Atualizar Valor Total do Contrato
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-8 w-8 mx-auto mb-2" />
                      <p>Nenhuma parcela configurada.</p>
                      <p className="text-sm">Use "Gerar Parcelas Automaticamente" ou "Adicionar Parcela" para começar.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract_type">Tipo de Contrato</Label>
              <Select value={formData.contract_type} onValueChange={(value) => setFormData({ ...formData, contract_type: value as "open_scope" | "closed_scope" | "NDA" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="closed_scope">Escopo Fechado</SelectItem>
                  <SelectItem value="open_scope">Escopo Aberto</SelectItem>
                  <SelectItem value="NDA">NDA</SelectItem>
                </SelectContent>
               </Select>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="contractor_type">Tipo de Contratante</Label>
               <Select value={formData.contractor_type} onValueChange={(value) => setFormData({ ...formData, contractor_type: value as "individual" | "legal_entity" })}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="individual">Pessoa Física</SelectItem>
                   <SelectItem value="legal_entity">Pessoa Jurídica</SelectItem>
                 </SelectContent>
               </Select>
             </div>

             {formData.contract_type === "open_scope" && (
               <div className="space-y-2">
                 <Label htmlFor="Horas">Horas</Label>
                 <Input
                   id="Horas"
                   type="number"
                   min="0"
                   step="1"
                   value={formData.Horas || ""}
                   onChange={(e) => setFormData({ ...formData, Horas: e.target.value })}
                   placeholder="Quantidade de horas"
                 />
               </div>
             )}
           </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_de_assinatura">Data de Assinatura</Label>
              <Input
                id="data_de_assinatura"
                type="date"
                value={formData.data_de_assinatura}
                onChange={(e) => setFormData({ ...formData, data_de_assinatura: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as "active" | "completed" | "cancelled" | "suspended" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link_contrato">Link do Contrato</Label>
            <Input
              id="link_contrato"
              type="url"
              value={formData.link_contrato}
              onChange={(e) => setFormData({ ...formData, link_contrato: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              value={formData.obs}
              onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
              placeholder="Observações adicionais"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="texto_contrato">Texto do Contrato (Markdown)</Label>

            {/* Rich Text Toolbar */}
            <div className="flex items-center justify-between p-3 border rounded-t-md bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => applyFormatting('bold')}
                  className="h-9 w-9 p-0 bg-white border-blue-300 hover:bg-blue-100 hover:text-blue-900 hover:border-blue-400 transition-all"
                  title="Negrito"
                >
                  <Bold className="h-4 w-4 text-blue-700" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => applyFormatting('italic')}
                  className="h-9 w-9 p-0 bg-white border-blue-300 hover:bg-blue-100 hover:text-blue-900 hover:border-blue-400 transition-all"
                  title="Itálico"
                >
                  <Italic className="h-4 w-4 text-blue-700" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => applyFormatting('underline')}
                  className="h-9 w-9 p-0 bg-white border-blue-300 hover:bg-blue-100 hover:text-blue-900 hover:border-blue-400 transition-all"
                  title="Sublinhado"
                >
                  <Underline className="h-4 w-4 text-blue-700" />
                </Button>

                <div className="mx-3 h-6 w-px bg-blue-300" />

                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-blue-700" />
                  <Select
                    value={formData.fontFamily}
                    onValueChange={(value) => setFormData({ ...formData, fontFamily: value })}
                  >
                    <SelectTrigger className="w-32 h-8 bg-white border-blue-300 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mono">Monospace</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="sans">Sans Serif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <span className="text-sm text-blue-700 font-medium">
                Selecione texto e use os botões para formatar
              </span>
            </div>

            <Textarea
              id="texto_contrato"
              value={formData.texto_contrato}
              onChange={(e) => setFormData({ ...formData, texto_contrato: e.target.value })}
              placeholder="Texto completo do contrato em Markdown..."
              rows={15}
              className="min-h-[400px] rounded-t-none text-sm border-blue-200 focus:border-blue-400 focus:ring-blue-400"
              style={getFontStyle(formData.fontFamily)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Use Markdown: **negrito**, *itálico*, # Título, - Lista</span>
              <span>{formData.texto_contrato.length} caracteres</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="correcoes_texto">Observações sobre Edições</Label>
            <Textarea
              id="correcoes_texto"
              value={formData.correcoes_texto}
              onChange={(e) => setFormData({ ...formData, correcoes_texto: e.target.value })}
              placeholder="Descreva as mudanças feitas no contrato..."
              rows={3}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Este campo será enviado no webhook junto com as alterações.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
