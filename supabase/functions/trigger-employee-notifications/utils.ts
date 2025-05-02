
// CORS headers for cross-origin requests
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper for preparing template data from employee and monthly value
export function prepareTemplateData(employee: any, monthlyValue: any) {
  // Add more detailed data to help with template rendering
  return {
    nome_funcionario: employee.name,
    email_funcionario: employee.email,
    valor_nota: monthlyValue.amount,
    data_nota: new Date().toISOString().split('T')[0],
    mes_referencia: formatMonthYear(monthlyValue.month)
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

// Logging helpers
export function logMessage(message: string, emoji = "ℹ️") {
  console.log(`${emoji} ${message}`);
}

export function logError(message: string, error: Error) {
  console.error(`❌ ${message}:`, error.message);
  if (error.stack) {
    console.error(error.stack);
  }
}

// Format date as YYYY-MM-01 for first day of current month
export function formatYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

// Check if current day matches configured day (or is test mode)
export function isConfiguredDay(currentDay: number, configuredDay: number): boolean {
  return currentDay === configuredDay;
}

// Format time as HH:MM for comparison
export function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Check if current time is within range of notification time
export function isTimeMatch(currentTime: string, notificationTime: string, minuteRange: number = 5): boolean {
  const [currHour, currMinute] = currentTime.split(':').map(Number);
  const [notifHour, notifMinute] = notificationTime.split(':').map(Number);
  
  const currMinutes = currHour * 60 + currMinute;
  const notifMinutes = notifHour * 60 + notifMinute;
  
  return Math.abs(currMinutes - notifMinutes) <= minuteRange;
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
    
    return recipients?.map((r: any) => r.email) || [];
  } catch (error) {
    logError("Error fetching CC recipients", error as Error);
    return []; // Return empty array if there's an error
  }
}
