
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
  let processed = content;
  
  // Replace all placeholders with actual data
  if (data.recipientName) {
    processed = processed.replace(/\{\{recipientName\}\}/g, data.recipientName);
  }
  
  if (data.responsibleName) {
    processed = processed.replace(/\{\{responsibleName\}\}/g, data.responsibleName);
  }
  
  if (data.billingValue !== undefined) {
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(data.billingValue);
    processed = processed.replace(/\{\{billingValue\}\}/g, formattedValue);
  }
  
  if (data.dueDate) {
    const date = new Date(data.dueDate);
    const formattedDate = date.toLocaleDateString('pt-BR');
    processed = processed.replace(/\{\{dueDate\}\}/g, formattedDate);
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
  
  return processed;
};

export const processEmailSubject = (subject: string, data: EmailData): string => {
  let processed = subject;
  
  // Replace all placeholders in subject with actual data
  if (data.recipientName) {
    processed = processed.replace(/\{\{recipientName\}\}/g, data.recipientName);
  }
  
  if (data.billingValue !== undefined) {
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(data.billingValue);
    processed = processed.replace(/\{\{billingValue\}\}/g, formattedValue);
  }
  
  if (data.dueDate) {
    const date = new Date(data.dueDate);
    const formattedDate = date.toLocaleDateString('pt-BR');
    processed = processed.replace(/\{\{dueDate\}\}/g, formattedDate);
  }
  
  if (data.descricaoServico) {
    processed = processed.replace(/\{\{descricaoServico\}\}/g, data.descricaoServico);
  }
  
  return processed;
};

export const convertToHtml = (content: string): string => {
  // Simple conversion of newlines to <br> tags
  return content.replace(/\n/g, '<br>');
};
