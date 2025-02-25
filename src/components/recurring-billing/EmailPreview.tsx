
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
  paymentMethod?: 'pix' | 'boleto' | 'credit_card';
}

export const EmailPreview = ({
  selectedTemplate,
  templates,
  clientName,
  amount,
  dueDay,
  description,
  installments,
  paymentMethod
}: EmailPreviewProps) => {
  if (!selectedTemplate) return null;

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
  if (!selectedTemplateData) return null;

  let content = selectedTemplateData.content;

  const replacements = {
    "{nome_cliente}": clientName || "Cliente",
    "{valor_cobranca}": (amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    "{data_vencimento}": String(dueDay || ""),
    "{plano_servico}": description || "",
    "{numero_parcela}": "1",
    "{total_parcelas}": String(installments || ""),
    "{forma_pagamento}": paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'boleto' ? 'Boleto' : 'Cartão de Crédito'
  };

  Object.entries(replacements).forEach(([key, value]) => {
    content = content.replace(new RegExp(key, 'g'), value);
  });

  return (
    <div className="space-y-2">
      <Label>Prévia do Email</Label>
      <div className="bg-background border rounded-md p-4 whitespace-pre-wrap text-sm">
        {content}
      </div>
    </div>
  );
};
