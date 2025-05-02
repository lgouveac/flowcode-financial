
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";
import { 
  corsHeaders, 
  prepareTemplateData, 
  logMessage, 
  logError, 
  isConfiguredDay, 
  formatYearMonth, 
  isTimeMatch, 
  formatTime 
} from "./utils.ts";
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
    let forceDay = false;
    let forceMonth = false;
    let ignoreFilters = false; 
    let debugMode = false;
    
    try {
      const { 
        test, 
        forceDay: forceDayParam, 
        forceMonth: forceMonthParam,
        ignoreFilters: ignoreFiltersParam, 
        debug 
      } = await req.json();
      
      isTestMode = !!test;
      forceDay = !!forceDayParam;
      forceMonth = !!forceMonthParam;
      ignoreFilters = !!ignoreFiltersParam;
      debugMode = !!debug;
    } catch (e) {
      // If no JSON body or parse error, assume not test mode
    }
    
    logMessage(`Employee notification trigger function called ${isTestMode ? "in TEST MODE" : ""} ${forceDay ? "with FORCE DAY" : ""} ${forceMonth ? "with FORCE MONTH" : ""} ${ignoreFilters ? "with IGNORE FILTERS" : ""} ${debugMode ? "with DEBUG" : ""}`, "🔔");
    
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
    const currentTime = formatTime(now);
    
    // Only proceed if today is the configured day to send emails or in test mode or if force/ignore filters
    const sendDay = globalSettings?.employee_emails_send_day || 5; // Default to 5th day of month
    
    if (debugMode) {
      logMessage(`Global Settings: ${JSON.stringify(globalSettings)}`, "🛠️");
      logMessage(`Email Settings: ${JSON.stringify(emailSettings)}`, "🛠️");
      logMessage(`Current day: ${currentDay}, Configured send day: ${sendDay}`, "📅");
      logMessage(`Current time: ${currentTime}, Configured time: ${emailSettings?.notification_time || 'not set'}`, "🕒");
      logMessage(`Force day: ${forceDay}, Force month: ${forceMonth}, Ignore filters: ${ignoreFilters}`, "⚙️");
    }
    
    // Skip day check if in test mode or force day is true or ignore filters
    if (!isTestMode && !forceDay && !ignoreFilters && !isConfiguredDay(currentDay, sendDay)) {
      logMessage("Not the configured day to send employee emails. Skipping.", "⏭️");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Not the configured day for employee emails", 
          currentDay,
          configuredDay: sendDay,
          isTestMode,
          forceDay,
          ignoreFilters
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // If we have configured notification time and we're not in test mode or ignore filters, check time
    if (emailSettings?.notification_time && !isTestMode && !forceDay && !ignoreFilters) {
      const configuredTime = emailSettings.notification_time;
      
      if (!isTimeMatch(currentTime, configuredTime, 5)) { // Increased time window to 5 minutes
        logMessage("Not the configured time to send employee emails. Skipping.", "⏭️");
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Not the configured time for employee emails", 
            currentTime,
            configuredTime,
            isTestMode,
            forceDay,
            ignoreFilters
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }

    // Get the current month in YYYY-MM-01 format or use a specific month for testing
    let currentMonth = formatYearMonth(now);
    if (debugMode) {
      logMessage(`Current month formatted: ${currentMonth}`, "📆");
    }
    
    // Get active employees with their monthly values - THIS IS THE KEY FIX
    const employeesWithValues = await fetchEmployeesWithValues(supabase, currentMonth, ignoreFilters);

    if (debugMode) {
      logMessage(`Found ${employeesWithValues.length} employees with values for month ${currentMonth}`, "👥");
    }

    // If no employees found, return early
    if (employeesWithValues.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No employees with monthly values found", 
          totalSent: 0,
          totalErrors: 0,
          totalEmployees: 0,
          currentMonth
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get the email template(s) for employees
    const emailTemplate = await fetchEmailTemplate(supabase);

    // Send emails to each employee
    const sentEmails = [];
    const emailErrors = [];
    
    for (const employee of employeesWithValues) {
      try {
        // Use the first monthly value in the array
        const monthlyValue = employee.employee_monthly_values[0];
        
        if (!monthlyValue && !ignoreFilters) {
          logMessage(`No monthly value found for employee ${employee.name} despite being in the list`, "⚠️");
          continue;
        }
        
        if (debugMode) {
          logMessage(`Processing employee: ${employee.name}, Value: ${monthlyValue?.amount || 'N/A'}`, "📧");
        }
        
        // Prepare the variable data for the template
        const templateData = prepareTemplateData(employee, monthlyValue || { amount: 0, month: currentMonth });
        
        // Send email 
        const result = await sendEmployeeEmail(supabase, employee, emailTemplate, templateData);
        
        if (result.success) {
          sentEmails.push({ employee: employee.name, result: result.result });
          logMessage(`Successfully sent email to ${employee.name} (${employee.email})`, "✅");
        } else {
          emailErrors.push({ employee: employee.name, error: result.error });
          logError(`Failed to send email to ${employee.name}`, new Error(result.error || "Unknown error"));
        }
      } catch (error: any) {
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
        totalEmployees: employeesWithValues?.length || 0,
        currentDay,
        configuredDay: sendDay,
        currentTime,
        configuredTime: emailSettings?.notification_time,
        currentMonth,
        isTestMode,
        forceDay,
        ignoreFilters
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
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
