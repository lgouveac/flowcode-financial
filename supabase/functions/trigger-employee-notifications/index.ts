
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";
import { corsHeaders, prepareTemplateData, logMessage, logError } from "./utils.ts";
import { 
  fetchGlobalSettings, 
  fetchEmailSettings, 
  fetchEmployeesWithValues, 
  fetchEmailTemplate, 
  sendEmployeeEmail 
} from "./email-service.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let isTestMode = false;
    try {
      const { test } = await req.json();
      isTestMode = !!test;
    } catch (e) {
      // If no JSON body or parse error, assume not test mode
    }
    
    logMessage(`Employee notification trigger function called ${isTestMode ? "in TEST MODE" : ""}`, "🔔");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://itlpvpdwgiwbdpqheemw.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseKey) {
      logError("Missing SUPABASE_SERVICE_ROLE_KEY environment variable", new Error("Missing key"));
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    logMessage("Checking for employee notifications to send", "🔍");
    
    // Get configuration settings
    const globalSettings = await fetchGlobalSettings(supabase);
    const emailSettings = await fetchEmailSettings(supabase);

    // Get the current date
    const now = new Date();
    const currentDay = now.getDate();
    
    // Only proceed if today is the configured day to send emails or in test mode
    const sendDay = globalSettings?.employee_emails_send_day || 5; // Default to 5th day of month
    
    logMessage(`Current day: ${currentDay}, Configured send day: ${sendDay}`, "📅");
    
    // Skip day check if in test mode
    if (!isTestMode && currentDay !== sendDay) {
      logMessage("Not the configured day to send employee emails. Skipping.", "⏭️");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Not the configured day for employee emails", 
          currentDay,
          configuredDay: sendDay 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get the current month in YYYY-MM-01 format
    const currentMonth = now.toISOString().substring(0, 7) + "-01";
    
    // Get active employees with their monthly values
    const employeesWithValues = await fetchEmployeesWithValues(supabase, currentMonth);

    // Get the default email template for employees
    const emailTemplate = await fetchEmailTemplate(supabase);

    // Send emails to each employee
    const sentEmails = [];
    const emailErrors = [];
    
    for (const employee of employeesWithValues) {
      try {
        // Extract the monthly value for this employee
        const monthlyValue = employee.employee_monthly_values[0];
        
        if (!monthlyValue) {
          logMessage(`No monthly value found for employee: ${employee.name} (${employee.id})`, "⚠️");
          continue;
        }
        
        // Prepare the variable data for the template
        const templateData = prepareTemplateData(employee, monthlyValue);
        
        // Send email
        const result = await sendEmployeeEmail(supabase, employee, emailTemplate, templateData);
        
        if (result.success) {
          sentEmails.push({ employee: employee.name, result: result.result });
        } else {
          emailErrors.push({ employee: employee.name, error: result.error });
        }
      } catch (error) {
        logError(`Error processing employee ${employee.name}`, error);
        emailErrors.push({ employee: employee.name, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isTestMode ? "Employee notification test completed" : "Employee notification process completed", 
        sentEmails, 
        errors: emailErrors,
        totalSent: sentEmails.length,
        totalErrors: emailErrors.length,
        totalEmployees: employeesWithValues?.length || 0
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    logError("Error in employee notification process", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
