
/**
 * Types for email data
 */
export interface EmailData {
  recipientName: string;
  responsibleName?: string;
  billingValue: number;
  dueDate: string;
  currentInstallment?: number;
  totalInstallments?: number;
  daysUntilDue: number;
  paymentMethod?: string;
  descricaoServico?: string;
}

/**
 * Process email content by replacing variables with actual values
 */
export function processEmailContent(content: string, data: EmailData): string {
  let processedContent = content;
  
  // Format date as DD/MM/YYYY
  const formattedDate = formatDate(data.dueDate);
  
  // Format monetary value
  const formattedValue = formatCurrency(data.billingValue);
  
  // Define all possible replacements
  const replacements: Record<string, string> = {
    "{nome_cliente}": data.recipientName || "Cliente",
    "{nome_responsavel}": data.responsibleName || "Responsável",
    "{valor_cobranca}": formattedValue,
    "{data_vencimento}": formattedDate,
    "{descricao_servico}": data.descricaoServico || "",
    "{plano_servico}": data.descricaoServico || "",
  };
  
  // Add optional replacements if they exist
  if (data.currentInstallment !== undefined && data.totalInstallments !== undefined) {
    replacements["{numero_parcela}"] = data.currentInstallment.toString();
    replacements["{total_parcelas}"] = data.totalInstallments.toString();
  }
  
  if (data.paymentMethod) {
    replacements["{forma_pagamento}"] = data.paymentMethod;
  }
  
  // Replace all variables in content
  Object.entries(replacements).forEach(([variable, value]) => {
    const regex = new RegExp(escapeRegExp(variable), 'g');
    processedContent = processedContent.replace(regex, value);
  });
  
  return processedContent;
}

/**
 * Process email subject by replacing variables with actual values
 */
export function processEmailSubject(subject: string, data: EmailData): string {
  let processedSubject = subject;
  
  // Format date as DD/MM/YYYY
  const formattedDate = formatDate(data.dueDate);
  
  // Format monetary value
  const formattedValue = formatCurrency(data.billingValue);
  
  // Define all possible replacements
  const replacements: Record<string, string> = {
    "{nome_cliente}": data.recipientName || "Cliente",
    "{nome_responsavel}": data.responsibleName || "Responsável",
    "{valor_cobranca}": formattedValue,
    "{data_vencimento}": formattedDate,
    "{descricao_servico}": data.descricaoServico || "",
    "{plano_servico}": data.descricaoServico || "",
  };
  
  // Add optional replacements if they exist
  if (data.currentInstallment !== undefined && data.totalInstallments !== undefined) {
    replacements["{numero_parcela}"] = data.currentInstallment.toString();
    replacements["{total_parcelas}"] = data.totalInstallments.toString();
  }
  
  if (data.paymentMethod) {
    replacements["{forma_pagamento}"] = data.paymentMethod;
  }
  
  // Replace all variables in content
  Object.entries(replacements).forEach(([variable, value]) => {
    const regex = new RegExp(escapeRegExp(variable), 'g');
    processedSubject = processedSubject.replace(regex, value);
  });
  
  return processedSubject;
}

/**
 * Convert plaintext content to HTML with paragraphs
 */
export function convertToHtml(content: string): string {
  const paragraphs = content
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => `<p style="margin-bottom: 1em; line-height: 1.5; text-align: left;">${line}</p>`)
    .join('\n');
    
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0; padding: 20px; text-align: left;">
        ${paragraphs}
      </body>
    </html>
  `;
}

/**
 * Format a date string to DD/MM/YYYY
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    return dateStr;
  }
}

/**
 * Format a number as currency (R$)
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Escape special characters in a string for use in a regular expression
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
