
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmailTemplate } from "@/types/email";
import { format } from "date-fns";

interface EmailPreviewProps {
  selectedTemplate: string;
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
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({
  selectedTemplate,
  templates,
  clientName = "Cliente Teste",
  responsibleName = "Responsável Teste",
  amount = 100,
  dueDay = 15,
  dueDate,
  description = "Descrição do serviço",
  installments = 1,
  currentInstallment = 1,
  paymentMethod = "pix",
}) => {
  const template = templates.find((t) => t.id === selectedTemplate);
  
  if (!template) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prévia do Email</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Selecione um template para visualizar</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'pix': return 'PIX';
      case 'boleto': return 'Boleto';
      case 'credit_card': return 'Cartão de Crédito';
      default: return method;
    }
  };

  // Updated to strip time and format as dd/MM/yyyy
  const formattedDueDate = dueDate 
    ? format(new Date(dueDate), 'dd/MM/yyyy')
    : `${dueDay.toString().padStart(2, '0')}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}`;

  let content = template.content
    .replace(/{nome_cliente}/gi, clientName)
    .replace(/{nome_responsavel}/gi, responsibleName)
    .replace(/{valor_cobranca}/gi, formatCurrency(amount))
    .replace(/{data_vencimento}/gi, formattedDueDate)
    .replace(/{descricao_servico}/gi, description)
    .replace(/{numero_parcela}/gi, currentInstallment.toString())
    .replace(/{total_parcelas}/gi, installments.toString())
    .replace(/{forma_pagamento}/gi, formatPaymentMethod(paymentMethod));

  let subject = template.subject
    .replace(/{nome_cliente}/gi, clientName)
    .replace(/{nome_responsavel}/gi, responsibleName)
    .replace(/{valor_cobranca}/gi, formatCurrency(amount))
    .replace(/{data_vencimento}/gi, formattedDueDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prévia do Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Assunto:</p>
          <p className="text-sm mt-1">{subject}</p>
        </div>
        <Separator />
        <div>
          <p className="text-sm font-medium">Conteúdo:</p>
          <div className="mt-2 whitespace-pre-line text-sm">
            {content}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
