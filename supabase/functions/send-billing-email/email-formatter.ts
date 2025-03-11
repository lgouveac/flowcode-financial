
import { formatCurrency, formatDate } from "./utils.ts";

export interface EmailData {
  recipientName: string;
  billingValue: number;
  dueDate: string;
  currentInstallment: number;
  totalInstallments: number;
  paymentMethod: string;
}

// Process content by replacing variables with their values
export const processEmailContent = (content: string, data: EmailData): string => {
  const formattedValue = formatCurrency(data.billingValue);
  const formattedDate = formatDate(data.dueDate);
  const installmentInfo = `${data.currentInstallment}/${data.totalInstallments}`;
  
  // Define replacement pairs in order of specificity (longest patterns first)
  const replacements: [RegExp, string][] = [
    [/{nome_cliente}/g, data.recipientName],
    [/{valor_cobranca}/g, formattedValue],
    [/{data_vencimento}/g, formattedDate],
    [/{numero_parcela}\/\{total_parcelas}/g, installmentInfo], // Handle "X/Y" pattern if present
    [/{numero_parcela}/g, String(data.currentInstallment)],
    [/{total_parcelas}/g, String(data.totalInstallments)],
    [/{forma_pagamento}/g, data.paymentMethod]
  ];
  
  // Apply all replacements
  let processedContent = content;
  replacements.forEach(([pattern, replacement]) => {
    processedContent = processedContent.replace(pattern, replacement);
  });
  
  // Emergency replacement for parcela variables that didn't get replaced
  if (processedContent.includes("parcela") && 
      (processedContent.includes("{numero_parcela}") || processedContent.includes("{total_parcelas}"))) {
    console.warn("⚠️ Warning: Template contains 'parcela' but variables weren't replaced. This may indicate a template issue.");
    
    // Emergency replacement to avoid "{parcela X/Y}" showing up in emails
    processedContent = processedContent
      .replace(/parcela {numero_parcela}\/\{total_parcelas}/g, `parcela ${installmentInfo}`)
      .replace(/parcela {numero_parcela}/g, `parcela ${data.currentInstallment}`);
  }
  
  return processedContent;
};

// Process email subject with variables
export const processEmailSubject = (subject: string, data: EmailData): string => {
  const formattedValue = formatCurrency(data.billingValue);
  const installmentInfo = `${data.currentInstallment}/${data.totalInstallments}`;
  
  const subjectReplacements: [RegExp, string][] = [
    [/{nome_cliente}/g, data.recipientName],
    [/{valor_cobranca}/g, formattedValue],
    [/{numero_parcela}\/\{total_parcelas}/g, installmentInfo],
    [/{numero_parcela}/g, String(data.currentInstallment)],
    [/{total_parcelas}/g, String(data.totalInstallments)]
  ];
  
  let processedSubject = subject;
  subjectReplacements.forEach(([pattern, replacement]) => {
    processedSubject = processedSubject.replace(pattern, replacement);
  });
  
  return processedSubject;
};

// Convert plain text content to HTML with left alignment
export const convertToHtml = (content: string): string => {
  // Convert line breaks to HTML paragraphs
  const paragraphs = content.split('\n').filter(p => p.trim() !== '');
  const htmlParagraphs = paragraphs.map(p => `<p style="margin-bottom: 1em; line-height: 1.5; text-align: left;">${p}</p>`).join('\n');
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; text-align: left;">
        ${htmlParagraphs}
      </body>
    </html>
  `;
};
