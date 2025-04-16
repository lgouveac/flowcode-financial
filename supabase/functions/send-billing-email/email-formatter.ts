
export interface EmailData {
  recipientName?: string;
  responsibleName?: string;
  billingValue?: number | string;
  dueDate?: string;
  daysUntilDue?: number;
  currentInstallment?: number;
  totalInstallments?: number;
  paymentMethod?: string;
  descricaoServico?: string;
  
  // Portuguese variable names
  nome_cliente?: string;
  nome_responsavel?: string;
  valor_cobranca?: string;
  data_vencimento?: string;
  descricao_servico?: string;
  forma_pagamento?: string;
  numero_parcela?: number;
  total_parcelas?: number;
  dias_atraso?: number;
}

export const processEmailContent = (content: string, data: EmailData): string => {
  let processed = content;
  
  // Replace all placeholders with actual data - English format
  if (data.recipientName) {
    processed = processed.replace(/\{\{recipientName\}\}/g, data.recipientName);
  }
  
  if (data.responsibleName) {
    processed = processed.replace(/\{\{responsibleName\}\}/g, data.responsibleName);
  }
  
  if (data.billingValue !== undefined) {
    const formattedValue = typeof data.billingValue === 'string' 
      ? data.billingValue 
      : new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(data.billingValue);
    processed = processed.replace(/\{\{billingValue\}\}/g, formattedValue);
  }
  
  if (data.dueDate) {
    processed = processed.replace(/\{\{dueDate\}\}/g, data.dueDate);
  }
  
  if (data.daysUntilDue !== undefined) {
    processed = processed.replace(/\{\{daysUntilDue\}\}/g, data.daysUntilDue.toString());
  }
  
  if (data.currentInstallment !== undefined && data.totalInstallments !== undefined) {
    processed = processed.replace(/\{\{currentInstallment\}\}/g, data.currentInstallment.toString());
    processed = processed.replace(/\{\{totalInstallments\}\}/g, data.totalInstallments.toString());
  }
  
  if (data.paymentMethod) {
    processed = processed.replace(/\{\{paymentMethod\}\}/g, data.paymentMethod);
  }
  
  if (data.descricaoServico) {
    processed = processed.replace(/\{\{descricaoServico\}\}/g, data.descricaoServico);
  }
  
  // Handle Portuguese variables format with curly braces - {nome_cliente}
  if (data.nome_cliente || data.recipientName) {
    processed = processed.replace(/{nome_cliente}/g, data.nome_cliente || data.recipientName || "");
  }
  
  if (data.nome_responsavel || data.responsibleName) {
    processed = processed.replace(/{nome_responsavel}/g, data.nome_responsavel || data.responsibleName || "");
  }
  
  if (data.valor_cobranca || data.billingValue) {
    const valor = data.valor_cobranca || (typeof data.billingValue === 'string' ? data.billingValue : 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(data.billingValue)));
    processed = processed.replace(/{valor_cobranca}/g, valor);
  }
  
  if (data.data_vencimento || data.dueDate) {
    processed = processed.replace(/{data_vencimento}/g, data.data_vencimento || data.dueDate || "");
  }
  
  if (data.descricao_servico || data.descricaoServico) {
    processed = processed.replace(/{descricao_servico}/g, data.descricao_servico || data.descricaoServico || "");
  }
  
  if (data.forma_pagamento || data.paymentMethod) {
    processed = processed.replace(/{forma_pagamento}/g, data.forma_pagamento || data.paymentMethod || "");
  }
  
  if (data.numero_parcela || data.currentInstallment) {
    processed = processed.replace(/{numero_parcela}/g, String(data.numero_parcela || data.currentInstallment || "1"));
  }
  
  if (data.total_parcelas || data.totalInstallments) {
    processed = processed.replace(/{total_parcelas}/g, String(data.total_parcelas || data.totalInstallments || "1"));
  }
  
  if (data.dias_atraso || data.daysUntilDue) {
    const diasAtraso = data.dias_atraso !== undefined ? data.dias_atraso : 
                      (data.daysUntilDue !== undefined ? Math.max(0, -data.daysUntilDue) : 0);
    processed = processed.replace(/{dias_atraso}/g, String(diasAtraso));
  }
  
  return processed;
};

export const processEmailSubject = (subject: string, data: EmailData): string => {
  let processed = subject;
  
  // Process for English format variables
  if (data.recipientName) {
    processed = processed.replace(/\{\{recipientName\}\}/g, data.recipientName);
  }
  
  if (data.billingValue !== undefined) {
    const formattedValue = typeof data.billingValue === 'string' 
      ? data.billingValue 
      : new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(data.billingValue);
    processed = processed.replace(/\{\{billingValue\}\}/g, formattedValue);
  }
  
  if (data.dueDate) {
    processed = processed.replace(/\{\{dueDate\}\}/g, data.dueDate);
  }
  
  if (data.descricaoServico) {
    processed = processed.replace(/\{\{descricaoServico\}\}/g, data.descricaoServico);
  }
  
  // Process for Portuguese format variables
  if (data.nome_cliente || data.recipientName) {
    processed = processed.replace(/{nome_cliente}/g, data.nome_cliente || data.recipientName || "");
  }
  
  if (data.valor_cobranca || data.billingValue) {
    const valor = data.valor_cobranca || (typeof data.billingValue === 'string' ? data.billingValue : 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(data.billingValue)));
    processed = processed.replace(/{valor_cobranca}/g, valor);
  }
  
  if (data.data_vencimento || data.dueDate) {
    processed = processed.replace(/{data_vencimento}/g, data.data_vencimento || data.dueDate || "");
  }
  
  if (data.descricao_servico || data.descricaoServico) {
    processed = processed.replace(/{descricao_servico}/g, data.descricao_servico || data.descricaoServico || "");
  }
  
  return processed;
};

export const convertToHtml = (content: string): string => {
  // Simple conversion of newlines to <br> tags
  return content.replace(/\n/g, '<br>');
};
