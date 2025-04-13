
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

  // Format amount to BRL currency
  const formattedAmount = amount 
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)
    : "R$ 0,00";

  // Format due date  
  let formattedDueDate = dueDate || "";
  if (dueDay && !dueDate) {
    const today = new Date();
    const dueDateTime = new Date(today.getFullYear(), today.getMonth(), dueDay);
    formattedDueDate = dueDateTime.toLocaleDateString('pt-BR');
  } else if (dueDate) {
    try {
      const dueDateObj = new Date(dueDate);
      if (!isNaN(dueDateObj.getTime())) {
        formattedDueDate = dueDateObj.toLocaleDateString('pt-BR');
      } else {
        formattedDueDate = "Data inválida";
      }
    } catch (e) {
      console.error("Error formatting date:", e);
      formattedDueDate = "Data inválida";
    }
  }

  // Safe values for installments
  const safeCurrentInstallment = currentInstallment && currentInstallment > 0 ? currentInstallment : 1;
  const safeTotalInstallments = installments && installments > 0 ? installments : 1;

  // Payment method display text
  const paymentMethodText = paymentMethod === 'pix' ? 'PIX' : 
                            paymentMethod === 'boleto' ? 'Boleto' : 
                            'Cartão de Crédito';

  // Prepare data for template rendering with properly formatted values
  const templateData = {
    nome_cliente: clientName || "Cliente",
    nome_responsavel: responsibleName || "Responsável",
    valor_cobranca: formattedAmount,
    data_vencimento: formattedDueDate,
    plano_servico: description || "",
    descricao_servico: description || "",
    numero_parcela: String(safeCurrentInstallment),
    total_parcelas: String(safeTotalInstallments),
    forma_pagamento: paymentMethodText
  };

  // Log the template data for debugging
  console.log("Template data:", templateData);
  console.log("Template content before rendering:", selectedTemplateData.content);

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

  console.log("Rendered content:", content);

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
