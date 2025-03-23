
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";
import { logMessage, logError } from "./utils.ts";

// Send email to employee using the provided template and data
export async function sendEmployeeEmail(
  supabase: any,
  employee: any,
  emailTemplate: any,
  templateData: Record<string, string>
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    logMessage(`Sending email to ${employee.name} (${employee.email})`, "📧");
    
    const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
      'send-email',
      {
        body: {
          to: employee.email,
          templateId: emailTemplate.id,
          type: "employees",
          subtype: "invoice",
          data: templateData
        }
      }
    );

    if (emailError) {
      throw new Error(`Error sending email: ${emailError.message}`);
    }

    logMessage(`Email sent to ${employee.name}: ${JSON.stringify(emailResponse)}`, "✅");
    return { success: true, result: emailResponse };
  } catch (error) {
    logError(`Error processing employee ${employee.name}`, error);
    return { success: false, error: error.message };
  }
}

// Fetch active employees with their monthly values for the current month
export async function fetchEmployeesWithValues(supabase: any, month: string): Promise<any[]> {
  const { data: employeesWithValues, error: employeesError } = await supabase
    .from("employees")
    .select(`
      id, 
      name, 
      email, 
      position, 
      status,
      employee_monthly_values!inner(amount, month, notes)
    `)
    .eq("status", "active")
    .eq("employee_monthly_values.month", month);

  if (employeesError) {
    logError("Error fetching employees with values", employeesError);
    throw new Error(`Failed to fetch employees with values: ${employeesError.message}`);
  }

  logMessage(`Found ${employeesWithValues?.length || 0} active employees with values`, "👥");
  return employeesWithValues || [];
}

// Fetch default email template for employees
export async function fetchEmailTemplate(supabase: any): Promise<any> {
  const { data: emailTemplate, error: templateError } = await supabase
    .from("email_templates")
    .select("*")
    .eq("type", "employees")
    .eq("subtype", "invoice")
    .eq("is_default", true)
    .limit(1)
    .maybeSingle();

  if (templateError) {
    logError("Error fetching email template", templateError);
    throw new Error(`Failed to fetch email template: ${templateError.message}`);
  }

  if (!emailTemplate) {
    logError("No default email template found for employees", new Error("Missing template"));
    throw new Error("No default email template found for employee emails");
  }

  logMessage(`Found email template: ${emailTemplate.name}`, "📝");
  return emailTemplate;
}

// Fetch global settings for email notifications
export async function fetchGlobalSettings(supabase: any): Promise<any> {
  const { data: globalSettings, error: globalError } = await supabase
    .from("global_settings")
    .select("employee_emails_send_day")
    .limit(1)
    .maybeSingle();

  if (globalError) {
    logError("Error fetching global settings", globalError);
    throw new Error(`Failed to fetch global settings: ${globalError.message}`);
  }

  logMessage("Global settings retrieved", "📊");
  return globalSettings;
}

// Fetch email settings for notification timing
export async function fetchEmailSettings(supabase: any): Promise<any> {
  const { data: emailSettings, error: emailError } = await supabase
    .from("employee_email_settings")
    .select("notification_time")
    .limit(1)
    .maybeSingle();

  if (emailError) {
    logError("Error fetching employee email settings", emailError);
    throw new Error(`Failed to fetch employee email settings: ${emailError.message}`);
  }

  logMessage("Email settings retrieved", "📧");
  return emailSettings;
}
