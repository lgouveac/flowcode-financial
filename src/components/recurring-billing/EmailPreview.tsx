
import { Label } from "@/components/ui/label";
import type { EmailTemplate } from "@/types/email";
import { useTemplateVariables } from "@/hooks/useTemplateVariables";

interface EmailPreviewProps {
  selectedTemplate?: string;
  templates: EmailTemplate[];
  clientName?: string;
  responsibleName?: string;
  amount?: number;
  dueDay?: number;
  description?: string;
  installments?: number;
  currentInstallment?: number;
  dueDate?: string;
  paymentMethod?: 'pix' | 'boleto' | 'credit_card';
}

export const EmailPreview = ({
  selectedTemplate,
  templates,
  clientName,
  responsibleName,
  amount,
  dueDay,
  dueDate,
  description,
  installments,
  currentInstallment,
  paymentMethod
}: EmailPreviewProps) => {
  const { renderTemplate } = useTemplateVariables();
  
  if (!selectedTemplate) return null;

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
  if (!selectedTemplateData) return null;

  // Prepare data for template rendering
  const templateData = {
    nome_cliente: clientName || "Cliente",
    nome_responsavel: responsibleName || "Responsável",
    valor_cobranca: amount || 0,
    data_vencimento: dueDate || (dueDay ? String(dueDay) : ""),
    plano_servico: description || "",
    descricao_servico: description || "",
    numero_parcela: currentInstallment || 1,
    total_parcelas: installments || 1,
    forma_pagamento: paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'boleto' ? 'Boleto' : 'Cartão de Crédito'
  };

  // Render the template content and subject
  const content = renderTemplate(
    selectedTemplateData.content, 
    selectedTemplateData.type, 
    selectedTemplateData.subtype, 
    templateData
  );
  
  const subject = renderTemplate(
    selectedTemplateData.subject, 
    selectedTemplateData.type, 
    selectedTemplateData.subtype, 
    templateData
  );

  return (
    <div className="space-y-2">
      <Label>Prévia do Email</Label>
      <div className="mb-2">
        <Label className="text-xs text-muted-foreground break-anywhere">Assunto: {subject}</Label>
      </div>
      <div className="bg-background border rounded-md p-3 sm:p-4 whitespace-pre-wrap text-sm text-left overflow-x-auto max-h-[400px] overflow-y-auto">
        {content}
      </div>
    </div>
  );
};
