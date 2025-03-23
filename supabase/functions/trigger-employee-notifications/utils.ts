
// Helper utilities for the employee notification system

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Format the current month for display (e.g., "March 2025")
export const formatMonth = (date: Date): string => {
  return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
};

// Prepare template data for emails
export const prepareTemplateData = (employee: any, monthlyValue: any): Record<string, string> => {
  const monthDate = new Date(monthlyValue.month);
  const formattedMonth = formatMonth(monthDate);
  
  return {
    nome_funcionario: employee.name,
    valor_nota: monthlyValue.amount,
    mes_referencia: formattedMonth,
    data_nota: new Date().toLocaleDateString('pt-BR'),
    posicao: employee.position || "",
    observacoes: monthlyValue.notes || "",
    periodo: formattedMonth,
    total_horas: "0", // Default value for hours template
    valor_mensal: monthlyValue.amount
  };
};

// Log message with emoji
export const logMessage = (message: string, emoji = "📝"): void => {
  console.log(`${emoji} ${message}`);
};

// Log error with emoji
export const logError = (message: string, error: any): void => {
  console.error(`❌ ${message}:`, error);
};
