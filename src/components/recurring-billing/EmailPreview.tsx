
import { Label } from "@/components/ui/label";
import type { EmailTemplate } from "@/types/email";

interface EmailPreviewProps {
  selectedTemplate?: string;
  templates: EmailTemplate[];
  clientName?: string;
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
  amount,
  dueDay,
  dueDate,
  description,
  installments,
  currentInstallment,
  paymentMethod
}: EmailPreviewProps) => {
  if (!selectedTemplate) return null;

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
  if (!selectedTemplateData) return null;

  let content = selectedTemplateData.content;
  let subject = selectedTemplateData.subject;

  const replacements = {
    "{nome_cliente}": clientName || "Cliente",
    "{valor_cobranca}": (amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    "{data_vencimento}": dueDate ? new Date(dueDate).toLocaleDateString('pt-BR') : dueDay ? String(dueDay) : "",
    "{plano_servico}": description || "",
    "{descricao_servico}": description || "",
    "{numero_parcela}": String(currentInstallment || 1),
    "{total_parcelas}": String(installments || 1),
    "{forma_pagamento}": paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'boleto' ? 'Boleto' : 'Cartão de Crédito'
  };

  Object.entries(replacements).forEach(([key, value]) => {
    content = content.replace(new RegExp(key, 'g'), value);
    subject = subject.replace(new RegExp(key, 'g'), value);
  });

  return (
    <div className="space-y-2">
      <Label>Prévia do Email</Label>
      <div className="mb-2">
        <Label className="text-xs text-muted-foreground">Assunto: {subject}</Label>
      </div>
      <div className="bg-background border rounded-md p-4 whitespace-pre-wrap text-sm text-left">
        {content}
      </div>
    </div>
  );
};
