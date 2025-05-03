
import { Label } from "@/components/ui/label";
import type { EmailTemplate } from "@/types/email";
import { useTemplateVariables } from "@/hooks/useTemplateVariables";
import { format } from "date-fns";

// Add full typing for client
interface EmailPreviewProps {
  selectedTemplate?: string;
  templates: EmailTemplate[];
  clientName?: string;
  responsibleName?: string;
  amount?: number;
  dueDay?: number;
  dueDate?: string;
  description?: string;
  installments?: number;
  currentInstallment?: number;
  paymentMethod?: 'pix' | 'boleto' | 'credit_card';
  client?: {
    cnpj?: string;
    cpf?: string;
    address?: string;
    name?: string;
    responsible_name?: string;
    partner_name?: string;
    partner_cpf?: string;
    company_name?: string;
  };
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
  paymentMethod,
  client
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
  let formattedDueDate = "";
  if (dueDate) {
    try {
      // Parse the date string (handles both ISO format and yyyy-MM-dd)
      const dueDateObj = new Date(dueDate);
      if (!isNaN(dueDateObj.getTime())) {
        formattedDueDate = format(dueDateObj, 'dd/MM/yyyy');
      } else {
        formattedDueDate = "Data inválida";
      }
    } catch (e) {
      console.error("Error formatting date:", e);
      formattedDueDate = "Data inválida";
    }
  } else if (dueDay) {
    const today = new Date();
    const dueDateTime = new Date(today.getFullYear(), today.getMonth(), dueDay);
    formattedDueDate = format(dueDateTime, 'dd/MM/yyyy');
  } else {
    formattedDueDate = format(new Date(), 'dd/MM/yyyy');
  }

  // Safe values for installments
  const safeCurrentInstallment = currentInstallment && currentInstallment > 0 ? currentInstallment : 1;
  const safeTotalInstallments = installments && installments > 0 ? installments : 1;

  // Payment method display text
  const paymentMethodText = paymentMethod === 'pix' ? 'PIX' : 
                            paymentMethod === 'boleto' ? 'Boleto' : 
                            'Cartão de Crédito';

  // Prepare data for template rendering with all possible client fields
  const templateData = {
    nome_cliente: clientName || client?.name || "Cliente",
    nome_responsavel: responsibleName || client?.responsible_name || client?.partner_name || "",
    valor_cobranca: formattedAmount,
    data_vencimento: formattedDueDate,
    plano_servico: description || "",
    descricao_servico: description || "",
    numero_parcela: String(safeCurrentInstallment),
    total_parcelas: String(safeTotalInstallments),
    forma_pagamento: paymentMethodText || "PIX",
    cnpj: client?.cnpj || "",
    cpf: client?.cpf || client?.partner_cpf || "",
    endereco: client?.address || "",
    valor_mensal: formattedAmount,
    data_inicio: format(new Date(), 'dd/MM/yyyy'),
    partner_name: client?.partner_name || "",
    partner_cpf: client?.partner_cpf || "",
    company_name: client?.company_name || ""
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
