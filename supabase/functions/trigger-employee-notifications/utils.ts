
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

// Check if today is the configured day to send emails - IMPROVED VERSION
export const isConfiguredDay = (currentDay: number, configuredDay: number): boolean => {
  logMessage(`Checking day match: current day ${currentDay}, configured day ${configuredDay}`, "📅");
  return currentDay === configuredDay;
};

// Compare time strings with tolerance (in minutes)
export const isTimeMatch = (currentTimeStr: string, configuredTimeStr: string, toleranceMinutes = 1): boolean => {
  try {
    if (!configuredTimeStr) return false;
    
    // Parse time strings (assumed format: "HH:MM" or "HH:MM:SS")
    const currentParts = currentTimeStr.split(':').map(Number);
    const configuredParts = configuredTimeStr.split(':').map(Number);
    
    // Calculate minutes since midnight for both times
    const currentMinutes = currentParts[0] * 60 + currentParts[1];
    const configuredMinutes = configuredParts[0] * 60 + configuredParts[1];
    
    // Check if current time is within tolerance range of configured time
    const diff = Math.abs(currentMinutes - configuredMinutes);
    const result = diff <= toleranceMinutes;
    
    logMessage(`Time check: current=${currentTimeStr}, configured=${configuredTimeStr}, difference=${diff} minutes, match=${result}`, "🕒");
    
    return result;
  } catch (error) {
    logError("Error comparing times", error);
    return false;
  }
};

// Format time to HH:MM format
export const formatTime = (date: Date): string => {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// Fetch CC recipients for email notifications
export const fetchCCRecipients = async (supabase: any): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("email_cc_recipients")
      .select("email")
      .eq("is_active", true);
    
    if (error) {
      logError("Error fetching CC recipients", error);
      return [];
    }
    
    const emails = data.map((recipient: any) => recipient.email);
    logMessage(`Found ${emails.length} CC recipients: ${emails.join(", ")}`, "📧");
    return emails;
  } catch (error) {
    logError("Error fetching CC recipients", error);
    return [];
  }
};
