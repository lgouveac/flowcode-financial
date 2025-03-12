
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
    console.log("🔔 Employee notification trigger function called");
    
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

    // Get the current date
    const now = new Date();
    const currentDay = now.getDate();
    
    // Only proceed if today is the configured day to send emails
    const sendDay = globalSettings?.employee_emails_send_day || 5; // Default to 5th day of month
    
    console.log(`📅 Current day: ${currentDay}, Configured send day: ${sendDay}`);
    
    if (currentDay !== sendDay) {
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

    // Get active employees
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("*")
      .eq("status", "active");

    if (employeesError) {
      console.error("❌ Error fetching employees:", employeesError);
      throw new Error(`Failed to fetch employees: ${employeesError.message}`);
    }

    console.log(`👥 Found ${employees?.length || 0} active employees`);

    // Get employee monthly values for the current month
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    
    const { data: monthlyValues, error: valuesError } = await supabase
      .from("employee_monthly_values")
      .select("*")
      .eq("month", currentMonth);

    if (valuesError) {
      console.error("❌ Error fetching monthly values:", valuesError);
      throw new Error(`Failed to fetch monthly values: ${valuesError.message}`);
    }

    console.log(`💰 Found ${monthlyValues?.length || 0} monthly values for ${currentMonth}`);

    // Send emails to each employee
    const sentEmails = [];
    const emailErrors = [];
    
    for (const employee of employees || []) {
      try {
        // Find this employee's monthly value
        const monthlyValue = monthlyValues?.find(mv => mv.employee_id === employee.id);
        
        if (!monthlyValue) {
          console.log(`⚠️ No monthly value found for employee: ${employee.name} (${employee.id})`);
          continue;
        }
        
        console.log(`📧 Sending email to ${employee.name} (${employee.email}) for amount: ${monthlyValue.amount}`);
        
        // Format the month for display (e.g., "March 2025")
        const monthDate = new Date(monthlyValue.month);
        const formattedMonth = monthDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        
        // Prepare content by replacing variables
        let emailContent = emailTemplate.content;
        emailContent = emailContent
          .replace(/{nome}/g, employee.name)
          .replace(/{mes}/g, formattedMonth)
          .replace(/{valor}/g, `R$ ${Number(monthlyValue.amount).toFixed(2).replace('.', ',')}`)
          .replace(/{posicao}/g, employee.position || "")
          .replace(/{observacoes}/g, monthlyValue.notes || "");
        
        let emailSubject = emailTemplate.subject;
        emailSubject = emailSubject
          .replace(/{mes}/g, formattedMonth);
        
        // Call the send-email function
        const response = await fetch(
          `${supabaseUrl}/functions/v1/send-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              to: employee.email,
              subject: emailSubject,
              content: emailContent,
              employee_name: employee.name,
              month: formattedMonth,
              amount: monthlyValue.amount,
              position: employee.position || "",
              notes: monthlyValue.notes || ""
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error sending email: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log(`✅ Email sent to ${employee.name}: ${JSON.stringify(result)}`);
        sentEmails.push({ employee: employee.name, result });
      } catch (error) {
        console.error(`❌ Error processing employee ${employee.name}:`, error);
        emailErrors.push({ employee: employee.name, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Employee notification process completed", 
        sentEmails, 
        errors: emailErrors,
        totalSent: sentEmails.length,
        totalErrors: emailErrors.length,
        totalEmployees: employees?.length || 0
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
