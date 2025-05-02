
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";
import { logMessage, logError, fetchCCRecipients } from "./utils.ts";

// Send email to employee using the provided template and data
export async function sendEmployeeEmail(
  supabase: any,
  employee: any,
  emailTemplate: any,
  templateData: Record<string, string | number>
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    logMessage(`Sending email to ${employee.name} (${employee.email})`, "📧");
    
    // Fetch CC recipients
    const ccRecipients = await fetchCCRecipients(supabase);
    
    // Log the templateData to make debugging easier
    logMessage(`Email template data: ${JSON.stringify(templateData)}`, "📝");
    
    const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
      'send-email',
      {
        body: {
          to: employee.email,
          cc: ccRecipients,
          templateId: emailTemplate.id,
          type: "employees",
          subtype: emailTemplate.subtype || "invoice",
          data: templateData
        }
      }
    );

    if (emailError) {
      throw new Error(`Error sending email: ${emailError.message}`);
    }

    logMessage(`Email sent to ${employee.name}: ${JSON.stringify(emailResponse)}`, "✅");
    return { success: true, result: emailResponse };
  } catch (error: any) {
    logError(`Error processing employee ${employee.name}`, error);
    return { success: false, error: error.message };
  }
}

// Fetch active employees with their monthly values for the current month
export async function fetchEmployeesWithValues(supabase: any, month: string, ignoreFilters: boolean = false): Promise<any[]> {
  try {
    logMessage(`Fetching employees with monthly values for month: ${month}, ignoreFilters: ${ignoreFilters}`, "🔍");
    
    // Include ALL employee fields in the SELECT query
    let query = supabase
      .from("employees")
      .select(`
        id, 
        name, 
        email, 
        position,
        phone,
        address,
        pix,
        cnpj,
        payment_method,
        status,
        preferred_template,
        employee_monthly_values(id, amount, month, notes)
      `);
    
    // Only apply filter if ignoreFilters is false
    if (!ignoreFilters) {
      query = query.eq("status", "active");
    }
    
    // If ignoring filters completely, we don't filter by month in the employee_monthly_values
    if (!ignoreFilters) {
      query = query.filter("employee_monthly_values.month", "eq", month);
    }
    
    const { data: employeesWithValues, error: employeesError } = await query;

    if (employeesError) {
      logError("Error fetching employees with values", employeesError);
      throw new Error(`Failed to fetch employees with values: ${employeesError.message}`);
    }

    // If ignoring filters, get all employees regardless of values
    if (ignoreFilters) {
      logMessage(`Retrieved ${employeesWithValues?.length || 0} employees in total (ignoring filters)`, "👥");
      
      // Ensure each employee has at least an empty array for monthly values
      const processedEmployees = employeesWithValues.map(emp => ({
        ...emp,
        employee_monthly_values: emp.employee_monthly_values || []
      }));
      
      return processedEmployees;
    } else {
      // Filter to only include employees who have monthly values
      const validEmployees = employeesWithValues?.filter(emp => 
        emp.employee_monthly_values && emp.employee_monthly_values.length > 0
      ) || [];
      
      // Log detailed info for debugging
      if (validEmployees.length > 0) {
        logMessage(`Found ${validEmployees.length} employees with values for ${month}`, "👥");
        validEmployees.forEach(emp => {
          logMessage(`Employee with values: ${emp.name}, Values: ${JSON.stringify(emp.employee_monthly_values)}`, "👤");
        });
      } else {
        logMessage(`No employees found with values for ${month}`, "⚠️");
        
        // Check if there are any monthly values for this month at all
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

      return validEmployees;
    }
  } catch (error: any) {
    logError("Error in fetchEmployeesWithValues", error);
    throw error;
  }
}

// Fetch all email templates for employees and find the appropriate one based on employee preference or default
export async function fetchEmailTemplate(supabase: any, preferredType?: string): Promise<any> {
  try {
    // Get all employee templates
    const { data: allTemplates, error: templatesError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("type", "employees")
      .in("subtype", ["invoice", "hours", "novo_subtipo"]);

    if (templatesError) {
      logError("Error fetching email templates", templatesError);
      throw new Error(`Failed to fetch email templates: ${templatesError.message}`);
    }

    if (!allTemplates || allTemplates.length === 0) {
      logError("No email templates found for employees", new Error("Missing template"));
      throw new Error("No email templates found for employee emails");
    }

    let template;

    // If a preferred type is specified, look for that template type first
    if (preferredType) {
      logMessage(`Looking for preferred template type: ${preferredType}`, "🔍");
      
      // First try to find a default template with the preferred type
      template = allTemplates.find(t => t.subtype === preferredType && t.is_default === true);
      
      // If no default found, use any template of the preferred type
      if (!template) {
        template = allTemplates.find(t => t.subtype === preferredType);
      }
    }

    // If no template found by preference, use default template logic
    if (!template) {
      // Prefer default templates, but use any template if no default is found
      const defaultTemplate = allTemplates.find(t => t.is_default === true);
      template = defaultTemplate || allTemplates[0];
    }
    
    logMessage(`Selected email template: ${template.name} (${template.subtype})`, "📝");
    return template;
  } catch (error: any) {
    logError("Error fetching email template", error);
    throw error;
  }
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
