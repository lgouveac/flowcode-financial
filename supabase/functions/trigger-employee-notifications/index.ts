import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";
import { 
  corsHeaders, 
  prepareTemplateData, 
  logMessage, 
  logError,
  fetchCCRecipients 
} from "./utils.ts";
import { 
  fetchEmailTemplate
} from "./email-service.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let bypass = false;
    const requestBody = await req.json();
    const { test, bypass: bypassFlag } = requestBody;
    
    bypass = !!bypassFlag;
    
    logMessage(`Employee notification trigger function called ${test ? "in TEST MODE" : ""} with BYPASS=${bypass}`, "🔔");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://itlpvpdwgiwbdpqheemw.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseKey) {
      logError("Missing SUPABASE_SERVICE_ROLE_KEY environment variable", new Error("Missing key"));
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Bypass mode - just send emails to all employees without any checks
    if (bypass) {
      logMessage("BYPASS mode activated - sending emails without checks", "⚠️");
      
      // Get all employees regardless of status
      const { data: allEmployees, error: employeeError } = await supabase
        .from("employees")
        .select("id, name, email, position");
      
      if (employeeError) {
        throw new Error("Failed to fetch employees: " + employeeError.message);
      }
      
      if (!allEmployees || allEmployees.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "No employees found in the database", 
            totalSent: 0
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
      
      logMessage(`Found ${allEmployees.length} employees`, "👥");
      
      // Get a template for sending emails - any template will do
      const emailTemplate = await fetchEmailTemplate(supabase);
      
      // Send emails to all employees
      const sentEmails = [];
      const emailErrors = [];
      
      for (const employee of allEmployees) {
        try {
          logMessage(`Processing employee: ${employee.name}`, "📧");
          
          // Get CC recipients
          const ccRecipients = await fetchCCRecipients(supabase);
          
          // Prepare dummy data for the template
          const templateData = {
            nome_funcionario: employee.name || "Funcionário",
            email_funcionario: employee.email || "email@exemplo.com",
            valor_nota: 0,
            data_nota: new Date().toISOString().split('T')[0],
            mes_referencia: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            posicao: employee.position || "Colaborador",
            observacoes: "Teste de notificação"
          };
          
          // Send email directly
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

          sentEmails.push({ employee: employee.name, email: employee.email });
          logMessage(`Successfully sent email to ${employee.name} (${employee.email})`, "✅");
        } catch (error: any) {
          logError(`Error processing employee ${employee.name}`, error);
          emailErrors.push({ employee: employee.name, error: error.message });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Emails enviados para ${sentEmails.length} funcionários (${emailErrors.length} erros)`, 
          sentEmails, 
          errors: emailErrors,
          totalSent: sentEmails.length,
          totalErrors: emailErrors.length,
          totalEmployees: allEmployees?.length || 0
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    // If not in bypass mode, continue with the regular flow
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
    

    logMessage("Checking for employee notifications to send", "🔍");
    
    // Get configuration settings
    //const globalSettings = await fetchGlobalSettings(supabase);
    //const emailSettings = await fetchEmailSettings(supabase);

    // Get the current date
    const now = new Date();
    const currentDay = now.getDate();
    //const currentTime = formatTime(now);
    
    // Only proceed if today is the configured day to send emails or in test mode or if force/ignore filters
    //const sendDay = globalSettings?.employee_emails_send_day || 5; // Default to 5th day of month
    
    //if (debugMode) {
    //  logMessage(`Global Settings: ${JSON.stringify(globalSettings)}`, "🛠️");
    //  logMessage(`Email Settings: ${JSON.stringify(emailSettings)}`, "🛠️");
    //  logMessage(`Current day: ${currentDay}, Configured send day: ${sendDay}`, "📅");
    //  logMessage(`Current time: ${currentTime}, Configured time: ${emailSettings?.notification_time || 'not set'}`, "🕒");
    //  logMessage(`Force day: ${forceDay}, Force month: ${forceMonth}, Ignore filters: ${ignoreFilters}`, "⚙️");
    //}
    
    // Skip day check if in test mode or force day is true or ignore filters
    //if (!isTestMode && !forceDay && !ignoreFilters && !isConfiguredDay(currentDay, sendDay)) {
    //  logMessage("Not the configured day to send employee emails. Skipping.", "⏭️");
    //  return new Response(
    //    JSON.stringify({ 
    //      success: true, 
    //      message: "Not the configured day for employee emails", 
    //      currentDay,
    //      configuredDay: sendDay,
    //      isTestMode,
    //      forceDay,
    //      ignoreFilters
    //    }),
    //    {
    //      headers: { ...corsHeaders, "Content-Type": "application/json" },
    //      status: 200,
    //    }
    //  );
    //}

    // If we have configured notification time and we're not in test mode or ignore filters, check time
    //if (emailSettings?.notification_time && !isTestMode && !forceDay && !ignoreFilters) {
    //  const configuredTime = emailSettings.notification_time;
      
    //  if (!isTimeMatch(currentTime, configuredTime, 5)) { // Increased time window to 5 minutes
    //    logMessage("Not the configured time to send employee emails. Skipping.", "⏭️");
    //    return new Response(
    //      JSON.stringify({ 
    //        success: true, 
    //        message: "Not the configured time for employee emails", 
    //        currentTime,
    //        configuredTime,
    //        isTestMode,
    //        forceDay,
    //        ignoreFilters
    //      }),
    //      {
    //        headers: { ...corsHeaders, "Content-Type": "application/json" },
    //        status: 200,
    //      }
    //    );
    //  }
    //}

    // Get the current month in YYYY-MM-01 format or use a specific month for testing
    let currentMonth = ""; //formatYearMonth(now);
    if (debugMode) {
      logMessage(`Current month formatted: ${currentMonth}`, "📆");
    }
    
    // Get active employees with their monthly values - THIS IS THE KEY FIX
    //const employeesWithValues = await fetchEmployeesWithValues(supabase, currentMonth, ignoreFilters);
    const employeesWithValues = [];

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
        //const result = await sendEmployeeEmail(supabase, employee, emailTemplate, templateData);
        const result = {success: true};
        
        if (result.success) {
          sentEmails.push({ employee: employee.name, /*result: result.result*/ });
          logMessage(`Successfully sent email to ${employee.name} (${employee.email})`, "✅");
        } else {
          //emailErrors.push({ employee: employee.name, error: result.error });
          logError(`Failed to send email to ${employee.name}`, new Error(/*result.error ||*/ "Unknown error"));
        }
      } catch (error: any) {
        logError(`Error processing employee ${employee.name}`, error);
        //emailErrors.push({ employee: employee.name, error: error.message });
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
        //configuredDay: sendDay,
        //currentTime,
        //configuredTime: emailSettings?.notification_time,
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
