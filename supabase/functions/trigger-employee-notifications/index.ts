
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
    // Parse request body safely
    let requestBody = {};
    let bypass = false;
    let test = false;
    let forceDay = false;
    let ignoreTime = false;
    let executionId = `manual-${new Date().toISOString()}`;
    
    try {
      if (req.body) {
        // Make sure the body can be parsed as JSON
        const bodyText = await req.text();
        logMessage(`Request body raw: ${bodyText}`, "🔍");
        
        if (bodyText && bodyText.trim() !== "") {
          requestBody = JSON.parse(bodyText);
          bypass = !!requestBody.bypass;
          test = !!requestBody.test;
          forceDay = !!requestBody.forceDay;
          ignoreTime = !!requestBody.ignoreTime;
          executionId = requestBody.execution_id || executionId;
          
          logMessage(`Request parameters: bypass=${bypass}, test=${test}, forceDay=${forceDay}, ignoreTime=${ignoreTime}, executionId=${executionId}`, "🔧");
        }
      }
    } catch (parseError) {
      // If parsing fails, just log and continue with empty object
      logError("Error parsing request body", parseError as Error);
      requestBody = {};
    }
    
    logMessage(`Employee notification trigger function called ${test ? "in TEST MODE" : ""} with BYPASS=${bypass}, EXECUTION_ID=${executionId}`, "🔔");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://itlpvpdwgiwbdpqheemw.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseKey) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    }

    logMessage(`Initializing Supabase client with URL: ${supabaseUrl}`, "🔌");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Se não estivermos em modo de teste ou bypass, verifique se é o dia correto
    if (!test && !bypass && !forceDay) {
      // Obter o dia de envio configurado
      const { data: globalSettings, error: settingsError } = await supabase
        .from("global_settings")
        .select("employee_emails_send_day")
        .limit(1)
        .single();
      
      if (settingsError) {
        logError("Failed to fetch global settings", settingsError);
        throw new Error("Failed to fetch global settings: " + settingsError.message);
      }
      
      const configuredDay = globalSettings?.employee_emails_send_day || 5;
      const currentDay = new Date().getDate();
      
      logMessage(`Checking day: current=${currentDay}, configured=${configuredDay}`, "📅");
      
      if (currentDay !== configuredDay) {
        logMessage(`Not sending notifications: current day (${currentDay}) doesn't match configured day (${configuredDay})`, "⏱️");
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Not the right day for notifications. Current day: ${currentDay}, Configured day: ${configuredDay}`,
            day: {
              current: currentDay,
              configured: configuredDay
            },
            testMode: test,
            executionId: executionId
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }
    
    // Se não estivermos em modo de teste ou bypass, verifique se o horário está dentro de 1 minuto do configurado
    if (!test && !bypass && !ignoreTime) {
      // Obter o horário de notificação configurado
      const { data: timeSettings, error: timeError } = await supabase
        .from("employee_email_settings")
        .select("notification_time")
        .limit(1)
        .single();
      
      if (timeError) {
        logError("Failed to fetch notification time settings", timeError);
        throw new Error("Failed to fetch notification time settings: " + timeError.message);
      }
      
      const configuredTime = timeSettings?.notification_time || "09:00:00";
      
      // Extrair hora e minuto configurados
      const configParts = configuredTime.split(":");
      const configHour = parseInt(configParts[0], 10);
      const configMinute = parseInt(configParts[1], 10);
      
      // Obter hora e minuto atuais
      const now = new Date();
      const currentHour = now.getUTCHours();
      const currentMinute = now.getUTCMinutes();
      
      logMessage(`Checking time: current=${currentHour}:${currentMinute}, configured=${configHour}:${configMinute}`, "⏰");
      
      // Verificar se estamos entre 1 minuto antes e o horário exato da notificação
      const isWithinTimeRange = (
        (currentHour === configHour && currentMinute >= configMinute - 1 && currentMinute <= configMinute) ||
        // Caso especial para quando o minuto é 0 (precisamos verificar a hora anterior, minuto 59)
        (configMinute === 0 && currentHour === configHour - 1 && currentMinute === 59)
      );
      
      if (!isWithinTimeRange) {
        logMessage(`Not sending notifications: current time (${currentHour}:${currentMinute}) is not within 1 minute of configured time (${configHour}:${configMinute})`, "⏱️");
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Not the right time for notifications. Current time: ${currentHour}:${currentMinute}, Configured time: ${configHour}:${configMinute}`,
            time: {
              current: `${currentHour}:${currentMinute}`,
              configured: configuredTime
            },
            testMode: test,
            executionId: executionId
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }

    // Get all employees
    logMessage("Fetching employees from database", "👥");
    const { data: allEmployees, error: employeeError } = await supabase
      .from("employees")
      .select("id, name, email, position, phone, address, pix, cnpj, payment_method, preferred_template, status");
    
    if (employeeError) {
      logError("Failed to fetch employees", employeeError);
      throw new Error("Failed to fetch employees: " + employeeError.message);
    }
    
    if (!allEmployees || allEmployees.length === 0) {
      logMessage("No employees found in the database", "⚠️");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No employees found in the database", 
          totalSent: 0,
          executionId: executionId
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    logMessage(`Found ${allEmployees.length} employees`, "👥");
    
    // Get templates for sending emails - fetch both types
    logMessage("Fetching email templates", "📝");
    const emailTemplates = await fetchEmailTemplate(supabase, test);
    
    if (!emailTemplates || (Array.isArray(emailTemplates) && emailTemplates.length === 0)) {
      logError("No email templates found", new Error("Templates not found"));
      throw new Error("No email templates found");
    }

    const templateMap = {};
    if (Array.isArray(emailTemplates)) {
      // Organize templates by subtype for easy access
      emailTemplates.forEach(template => {
        templateMap[template.subtype] = template;
      });
      logMessage(`Loaded ${emailTemplates.length} templates: ${Object.keys(templateMap).join(", ")}`, "📝");
    } else {
      // If single template was returned
      templateMap[emailTemplates.subtype] = emailTemplates;
      logMessage(`Loaded single template: ${emailTemplates.subtype}`, "📝");
    }
    
    // Send emails to employees based on their preferred template when available
    const sentEmails = [];
    const emailErrors = [];
    
    for (const employee of allEmployees) {
      try {
        logMessage(`Processing employee: ${employee.name} (${employee.email})`, "📧");
        
        // Skip inactive employees unless in test mode
        if (employee.status !== 'active' && !test) {
          logMessage(`Skipping inactive employee: ${employee.name}`, "⏩");
          continue;
        }
        
        // Determine which template to use based on employee preference if available
        const preferredTemplate = employee.preferred_template || "invoice";
        const template = templateMap[preferredTemplate] || templateMap["invoice"] || emailTemplates[0];

        if (!template) {
          logError(`No template available for preferred type: ${preferredTemplate}`, new Error("Template not found"));
          throw new Error(`No template available for preferred type: ${preferredTemplate}`);
        }
        
        logMessage(`Using template: ${template.subtype} for employee ${employee.name}`, "📄");
        
        // Get CC recipients
        const ccRecipients = await fetchCCRecipients(supabase);
        
        // Get employee's current monthly value
        logMessage(`Fetching monthly value for employee: ${employee.id}`, "💰");
        const { data: monthlyValues, error: monthlyError } = await supabase
          .from("employee_monthly_values")
          .select("*")
          .eq("employee_id", employee.id)
          .order("month", { ascending: false })
          .limit(1);
        
        if (monthlyError) {
          logError(`Error fetching monthly values for employee ${employee.name}`, monthlyError);
        }
        
        const monthlyValue = monthlyValues && monthlyValues.length > 0 ? monthlyValues[0] : null;
        logMessage(`Monthly value for ${employee.name}: ${monthlyValue ? monthlyValue.amount : 'None found'}`, "💰");
        
        // Prepare data for the template with all employee fields
        const templateData = prepareTemplateData(employee, monthlyValue);
        
        // Send email directly
        logMessage(`Sending email to ${employee.email}`, "✉️");
        const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
          'send-email',
          {
            body: {
              to: employee.email,
              cc: ccRecipients,
              templateId: template.id,
              type: "employees",
              subtype: template.subtype || "invoice",
              data: templateData
            }
          }
        );

        if (emailError) {
          logError(`Error sending email to ${employee.email}`, emailError);
          throw new Error(`Error sending email: ${emailError.message}`);
        }

        sentEmails.push({ 
          employee: employee.name, 
          email: employee.email, 
          template: template.subtype,
          preferred_template: preferredTemplate,
          response: emailResponse
        });
        logMessage(`Successfully sent email to ${employee.name} (${employee.email}) using template: ${template.subtype}`, "✅");
      } catch (error: any) {
        logError(`Error processing employee ${employee.name}`, error);
        emailErrors.push({ employee: employee.name, error: error.message });
      }
    }

    logMessage(`Completed processing ${allEmployees.length} employees. Sent: ${sentEmails.length}, Errors: ${emailErrors.length}`, "🏁");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Emails enviados para ${sentEmails.length} funcionários (${emailErrors.length} erros)`, 
        sentEmails, 
        errors: emailErrors,
        totalSent: sentEmails.length,
        totalErrors: emailErrors.length,
        totalEmployees: allEmployees?.length || 0,
        executionId: executionId,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    logError("Fatal error in employee notification process", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
