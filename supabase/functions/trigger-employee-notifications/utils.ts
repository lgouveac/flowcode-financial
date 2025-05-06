
// CORS headers for cross-origin requests
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper for preparing template data from employee and monthly value
export function prepareTemplateData(employee: any, monthlyValue: any) {
  // Handle the case where monthlyValue might be null
  const amount = monthlyValue?.amount || 0;
  const monthDate = monthlyValue?.month ? new Date(monthlyValue.month) : new Date();
  
  // Log the data being used
  logMessage(`Preparing template data for ${employee.name} with monthly value: ${JSON.stringify(monthlyValue)}`, "📋");
  
  // Ensure all employee fields are included in the template data
  return {
    nome_funcionario: employee.name || "Funcionário",
    email_funcionario: employee.email || "email@exemplo.com",
    valor_nota: amount,
    data_nota: new Date().toISOString().split('T')[0],
    mes_referencia: formatMonthYear(monthDate.toISOString()),
    posicao: employee.position || "Colaborador",
    observacoes: monthlyValue?.notes || "",
    phone: employee.phone || "",
    address: employee.address || "",
    pix: employee.pix || "",
    cnpj: employee.cnpj || "",
    payment_method: employee.payment_method || "",
    valor_mensal: amount
  };
}

// Format date as month/year in PT-BR format
function formatMonthYear(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateStr;
  }
}

// Logging helpers with timestamp and emoji for better visibility
export function logMessage(message: string, emoji = "ℹ️") {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${emoji} ${message}`);
}

export function logError(message: string, error: Error) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ ${message}:`, error.message);
  if (error.stack) {
    console.error(error.stack);
  }
}

// Format date as YYYY-MM-01 for first day of current month
export function formatYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

// Time functions that always return true - no checks
export function isConfiguredDay(): boolean {
  return true;
}

export function isTimeMatch(): boolean {
  return true;
}

// Fetch CC recipients for employee emails
export async function fetchCCRecipients(supabase: any) {
  try {
    const { data: recipients, error } = await supabase
      .from("email_cc_recipients")
      .select("email")
      .eq("is_active", true);
    
    if (error) {
      throw error;
    }
    
    logMessage(`Found ${recipients?.length || 0} CC recipients`, "📧");
    return recipients?.map((r: any) => r.email) || [];
  } catch (error) {
    logError("Error fetching CC recipients", error as Error);
    return []; // Return empty array if there's an error
  }
}
