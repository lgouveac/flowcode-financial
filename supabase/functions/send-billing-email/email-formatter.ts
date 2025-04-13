// Email formatting utilities

export interface EmailData {
  recipientName?: string;
  responsibleName?: string;
  billingValue?: number;
  dueDate?: string;
  daysUntilDue?: number;
  currentInstallment?: number;
  totalInstallments?: number;
  paymentMethod?: string;
  descricaoServico?: string;
}

export const processEmailContent = (content: string, data: EmailData): string => {
  let processedContent = content;
  
  // Create a mapping of template variables to their values
  const variableMap: Record<string, string> = {
    // Client variables
    '{nome_cliente}': data.recipientName || 'Cliente',
    '{nome_responsavel}': data.responsibleName || 'Responsável',
    '{valor_cobranca}': formatCurrency(data.billingValue || 0),
    '{data_vencimento}': formatDate(data.dueDate),
    '{plano_servico}': data.descricaoServico || '',
    '{descricao_servico}': data.descricaoServico || '',
    '{numero_parcela}': String(data.currentInstallment || 1),
    '{total_parcelas}': String(data.totalInstallments || 1),
    '{forma_pagamento}': data.paymentMethod || 'PIX',
  };
  
  // Replace all variables in the content
  for (const [variable, value] of Object.entries(variableMap)) {
    const regex = new RegExp(variable, 'g');
    processedContent = processedContent.replace(regex, value);
  }
  
  // Find any remaining unresolved variables
  const remainingVariables = processedContent.match(/{[^{}]+}/g) || [];
  for (const variable of remainingVariables) {
    const variableName = variable.replace(/[{}]/g, '');
    const fallbackValue = getFallbackValue(variableName);
    const regex = new RegExp(`{${variableName}}`, 'g');
    processedContent = processedContent.replace(regex, fallbackValue);
  }
  
  console.log("Rendered content:", processedContent);
  return processedContent;
};

export const processEmailSubject = (subject: string, data: EmailData): string => {
  // Use the same processing logic for the subject
  return processEmailContent(subject, data);
};

export const convertToHtml = (content: string): string => {
  // Convert newlines to <br> tags for HTML emails
  return content.replace(/\n/g, '<br>');
};

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
};

// Helper function to format date
const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    console.error("Error formatting date:", e);
    return '';
  }
};

// Helper function to provide fallback values for common variables
const getFallbackValue = (variableName: string): string => {
  switch (variableName) {
    case 'nome_cliente':
      return 'Cliente';
    case 'nome_responsavel':
      return 'Responsável';
    case 'valor_cobranca':
      return 'R$ 0,00';
    case 'data_vencimento':
      return new Date().toLocaleDateString('pt-BR');
    case 'numero_parcela':
      return '1';
    case 'total_parcelas':
      return '1';
    case 'forma_pagamento':
      return 'PIX';
    default:
      return `[${variableName}]`;
  }
};
