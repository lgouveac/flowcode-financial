
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmailTemplate } from "@/types/email";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/utils/formatters";

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
  client?: any;
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
  client
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

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'pix': return 'PIX';
      case 'boleto': return 'Boleto';
      case 'credit_card': return 'Cartão de Crédito';
      default: return method;
    }
  };

  // Format the date properly
  let formattedDueDate = "";
  if (dueDate) {
    try {
      // Try to parse the ISO date string
      const parsedDate = parseISO(dueDate);
      if (isValid(parsedDate)) {
        formattedDueDate = format(parsedDate, 'dd/MM/yyyy', { locale: ptBR });
      } else {
        // Handle non-standard date formats
        const parts = dueDate.split('-');
        if (parts.length === 3) {
          const dateObject = new Date(
            parseInt(parts[0]), // year
            parseInt(parts[1]) - 1, // month (0-indexed)
            parseInt(parts[2]) // day
          );
          if (isValid(dateObject)) {
            formattedDueDate = format(dateObject, 'dd/MM/yyyy', { locale: ptBR });
          } else {
            formattedDueDate = dueDate; // Keep as is if parsing fails
          }
        } else {
          formattedDueDate = dueDate; // Keep as is for other formats
        }
      }
    } catch (e) {
      console.warn(`Could not format date: ${dueDate}`, e);
      formattedDueDate = dueDate; // Keep original if format fails
    }
  } else if (dueDay) {
    // If only dueDay is provided
    const today = new Date();
    const dueDateWithDay = new Date(today.getFullYear(), today.getMonth(), dueDay);
    formattedDueDate = format(dueDateWithDay, 'dd/MM/yyyy', { locale: ptBR });
  } else {
    formattedDueDate = format(new Date(), 'dd/MM/yyyy', { locale: ptBR });
  }

  let content = template.content
    .replace(/{nome_cliente}/gi, clientName || "")
    .replace(/{nome_responsavel}/gi, responsibleName || client?.responsible_name || "")
    .replace(/{valor_cobranca}/gi, formatCurrency(amount))
    .replace(/{data_vencimento}/gi, formattedDueDate)
    .replace(/{descricao_servico}/gi, description)
    .replace(/{plano_servico}/gi, description)
    .replace(/{numero_parcela}/gi, currentInstallment.toString())
    .replace(/{total_parcelas}/gi, installments.toString())
    .replace(/{forma_pagamento}/gi, formatPaymentMethod(paymentMethod));

  // Add other client data if available
  if (client) {
    content = content
      .replace(/{cnpj}/gi, client.cnpj || "")
      .replace(/{cpf}/gi, client.cpf || "")
      .replace(/{endereco}/gi, client.address || "")
      .replace(/{partner_name}/gi, client.partner_name || "");
  }

  let subject = template.subject
    .replace(/{nome_cliente}/gi, clientName || "")
    .replace(/{nome_responsavel}/gi, responsibleName || client?.responsible_name || "")
    .replace(/{valor_cobranca}/gi, formatCurrency(amount))
    .replace(/{data_vencimento}/gi, formattedDueDate);

  if (client) {
    subject = subject
      .replace(/{cnpj}/gi, client.cnpj || "")
      .replace(/{cpf}/gi, client.cpf || "")
      .replace(/{endereco}/gi, client.address || "")
      .replace(/{partner_name}/gi, client.partner_name || "");
  }

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
