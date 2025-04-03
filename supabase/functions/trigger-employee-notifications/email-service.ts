
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";
import { logMessage, logError, fetchCCRecipients } from "./utils.ts";

// Send email to employee using the provided template and data
export async function sendEmployeeEmail(
  supabase: any,
  employee: any,
  emailTemplate: any,
  templateData: Record<string, string>
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    logMessage(`Sending email to ${employee.name} (${employee.email})`, "📧");
    
    // Fetch CC recipients
    const ccRecipients = await fetchCCRecipients(supabase);
    
    const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
      'send-email',
      {
        body: {
          to: employee.email,
          cc: ccRecipients,
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
  try {
    logMessage(`Fetching employees with monthly values for month: ${month}`, "🔍");
    
    const { data: employeesWithValues, error: employeesError } = await supabase
      .from("employees")
      .select(`
        id, 
        name, 
        email, 
        position, 
        status,
        employee_monthly_values!inner(id, amount, month, notes)
      `)
      .eq("status", "active")
      .eq("employee_monthly_values.month", month);

    if (employeesError) {
      logError("Error fetching employees with values", employeesError);
      throw new Error(`Failed to fetch employees with values: ${employeesError.message}`);
    }

    // More detailed logging about what was found
    if (employeesWithValues && employeesWithValues.length > 0) {
      logMessage(`Found ${employeesWithValues.length} active employees with values for ${month}`, "👥");
      employeesWithValues.forEach(emp => {
        logMessage(`Employee with values: ${emp.name}, Values: ${JSON.stringify(emp.employee_monthly_values)}`, "👤");
      });
    } else {
      logMessage(`No active employees found with values for ${month}`, "⚠️");
      
      // Let's check if there are any monthly values for this month at all
      const { data: allMonthlyValues, error: allValuesError } = await supabase
        .from("employee_monthly_values")
        .select("id, employee_id, amount, month")
        .eq("month", month);
        
      if (allValuesError) {
        logError("Error checking all monthly values", allValuesError);
      } else if (allMonthlyValues && allMonthlyValues.length > 0) {
        logMessage(`Found ${allMonthlyValues.length} monthly values for ${month}, but no active employees match`, "❓");
        
        // For each monthly value, check the employee status
        for (const mv of allMonthlyValues) {
          const { data: empData, error: empError } = await supabase
            .from("employees")
            .select("id, name, status")
            .eq("id", mv.employee_id)
            .single();
            
          if (empError) {
            logMessage(`Error looking up employee ${mv.employee_id}: ${empError.message}`, "❌");
          } else if (empData) {
            logMessage(`Monthly value ${mv.id} belongs to ${empData.name} (status: ${empData.status})`, "ℹ️");
          } else {
            logMessage(`Monthly value ${mv.id} belongs to non-existent employee ${mv.employee_id}`, "❌");
          }
        }
      } else {
        logMessage(`No monthly values found at all for ${month}`, "❌");
      }
    }

    return employeesWithValues || [];
  } catch (error) {
    logError("Error in fetchEmployeesWithValues", error);
    throw error;
  }
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
