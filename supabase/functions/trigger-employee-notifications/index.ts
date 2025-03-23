
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    
    console.log("🔔 Employee notification trigger function called", isTestMode ? "in TEST MODE" : "");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://itlpvpdwgiwbdpqheemw.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseKey) {
      console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔍 Checking for employee notifications to send");
    
    // Get global settings for employee emails send day
    const { data: globalSettings, error: globalError } = await supabase
      .from("global_settings")
      .select("employee_emails_send_day")
      .limit(1)
      .maybeSingle();

    if (globalError) {
      console.error("❌ Error fetching global settings:", globalError);
      throw new Error(`Failed to fetch global settings: ${globalError.message}`);
    }

    console.log("📊 Global settings:", globalSettings);

    // Get employee email settings for notification time
    const { data: emailSettings, error: emailError } = await supabase
      .from("employee_email_settings")
      .select("notification_time")
      .limit(1)
      .maybeSingle();

    if (emailError) {
      console.error("❌ Error fetching employee email settings:", emailError);
      throw new Error(`Failed to fetch employee email settings: ${emailError.message}`);
    }

    console.log("📧 Email settings:", emailSettings);

    // Get the current date
    const now = new Date();
    const currentDay = now.getDate();
    
    // Only proceed if today is the configured day to send emails or in test mode
    const sendDay = globalSettings?.employee_emails_send_day || 5; // Default to 5th day of month
    
    console.log(`📅 Current day: ${currentDay}, Configured send day: ${sendDay}`);
    
    // Skip day check if in test mode
    if (!isTestMode && currentDay !== sendDay) {
      console.log("⏭️ Not the configured day to send employee emails. Skipping.");
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

    // Get active employees with their monthly values
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
      .eq("employee_monthly_values.month", now.toISOString().substring(0, 7) + "-01");

    if (employeesError) {
      console.error("❌ Error fetching employees with values:", employeesError);
      throw new Error(`Failed to fetch employees with values: ${employeesError.message}`);
    }

    console.log(`👥 Found ${employeesWithValues?.length || 0} active employees with values`);

    // Get the default email template for employees
    const { data: emailTemplate, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("type", "employees")
      .eq("subtype", "invoice")
      .eq("is_default", true)
      .limit(1)
      .maybeSingle();

    if (templateError) {
      console.error("❌ Error fetching email template:", templateError);
      throw new Error(`Failed to fetch email template: ${templateError.message}`);
    }

    if (!emailTemplate) {
      console.error("❌ No default email template found for employees");
      throw new Error("No default email template found for employee emails");
    }

    console.log("📝 Found email template:", emailTemplate.name);

    // Send emails to each employee
    const sentEmails = [];
    const emailErrors = [];
    
    for (const employee of employeesWithValues || []) {
      try {
        // Extract the monthly value for this employee
        const monthlyValue = employee.employee_monthly_values[0];
        
        if (!monthlyValue) {
          console.log(`⚠️ No monthly value found for employee: ${employee.name} (${employee.id})`);
          continue;
        }
        
        console.log(`📧 Sending email to ${employee.name} (${employee.email}) for amount: ${monthlyValue.amount}`);
        
        // Format the month for display (e.g., "March 2025")
        const monthDate = new Date(monthlyValue.month);
        const formattedMonth = monthDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        
        // Prepare the variable data for the template
        const templateData = {
          nome_funcionario: employee.name,
          valor_nota: monthlyValue.amount,
          mes_referencia: formattedMonth,
          data_nota: new Date().toLocaleDateString('pt-BR'),
          posicao: employee.position || "",
          observacoes: monthlyValue.notes || "",
          periodo: formattedMonth,
          total_horas: "0", // Default value for hours template
          valor_mensal: monthlyValue.amount
        };
        
        // Call the send-email function with the template ID and data
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

        console.log(`✅ Email sent to ${employee.name}: ${JSON.stringify(emailResponse)}`);
        sentEmails.push({ employee: employee.name, result: emailResponse });
      } catch (error) {
        console.error(`❌ Error processing employee ${employee.name}:`, error);
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
    console.error("❌ Error in employee notification process:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
