
// Helper utilities for the employee notification system

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Format the current month for display (e.g., "March 2025")
export const formatMonth = (date: Date): string => {
  return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
};

// Format date in DD/MM/YYYY format
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR');
};

// Prepare template data for emails
export const prepareTemplateData = (employee: any, monthlyValue: any): Record<string, string> => {
  const monthDate = new Date(monthlyValue.month);
  const formattedMonth = formatMonth(monthDate);
  
  return {
    nome_funcionario: employee.name,
    valor_nota: monthlyValue.amount,
    mes_referencia: formattedMonth,
    data_nota: formatDate(new Date()),
    posicao: employee.position || "",
    observacoes: monthlyValue.notes || "",
    periodo: formattedMonth,
    total_horas: "0", // Default value for hours template
    valor_mensal: monthlyValue.amount
  };
};

// Log message with emoji and timestamp
export const logMessage = (message: string, emoji = "📝"): void => {
  console.log(`${emoji} [${new Date().toISOString()}] ${message}`);
};

// Log error with emoji and timestamp
export const logError = (message: string, error: any): void => {
  console.error(`❌ [${new Date().toISOString()}] ${message}:`, error);
};

// Format a date object to YYYY-MM-01 format (first day of month)
export const formatYearMonth = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
};

// Check if today is the configured day to send emails
export const isConfiguredDay = (currentDay: number, configuredDay: number): boolean => {
  return currentDay === configuredDay;
};
