
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://itlpvpdwgiwbdpqheemw.supabase.co";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseServiceKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the current date
    const now = new Date();
    const currentDay = now.getDate();
    
    // Get the email settings from global_settings
    const { data: settings, error: settingsError } = await supabase
      .from("global_settings")
      .select("employee_emails_send_day")
      .single();
    
    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      throw new Error(`Error fetching settings: ${settingsError.message}`);
    }

    // Get the notification time from email_notification_settings
    const { data: timeSettings, error: timeError } = await supabase
      .from("email_notification_settings")
      .select("notification_time")
      .single();
    
    if (timeError && timeError.code !== "PGRST116") {
      console.error("Error fetching time settings:", timeError);
      throw new Error(`Error fetching time settings: ${timeError.message}`);
    }

    const emailSendDay = settings?.employee_emails_send_day || 5;
    
    // Log the current day and configured day
    console.log(`Current day: ${currentDay}, Email send day: ${emailSendDay}`);
    
    // Only continue if the current day matches the configured send day
    if (currentDay !== emailSendDay) {
      return new Response(
        JSON.stringify({ 
          message: `Not sending emails now. Current day: ${currentDay}, Configured send day: ${emailSendDay}`,
          match: false
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    console.log(`Day matched (${currentDay}). Proceeding with email sending...`);
    
    // Fetch email templates
    const { data: templates, error: templatesError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("type", "employees")
      .eq("is_default", true);
      
    if (templatesError) {
      console.error("Error fetching templates:", templatesError);
      throw new Error(`Error fetching templates: ${templatesError.message}`);
    }

    // Create a map of templates by subtype
    const templateMap = templates.reduce((acc, template) => {
      acc[template.subtype] = template;
      return acc;
    }, {});
    
    // Fetch active employees
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, name, email, type")
      .eq("status", "active");
      
    if (employeesError) {
      console.error("Error fetching employees:", employeesError);
      throw new Error(`Error fetching employees: ${employeesError.message}`);
    }
    
    console.log(`Found ${employees?.length || 0} active employees to notify`);
    
    // Count of successfully sent emails
    let sentCount = 0;
    const results = [];
    
    // Send emails to each employee based on their type (invoice or hours)
    for (const employee of employees || []) {
      const templateType = employee.type === "freelancer" ? "invoice" : "hours";
      const template = templateMap[templateType];
      
      if (!template) {
        console.log(`No template found for employee type: ${templateType}`);
        continue;
      }
      
      try {
        console.log(`Sending email to ${employee.name} (${employee.email})`);
        
        // Call the process-billing-notifications function to format and send the email
        const emailResponse = await fetch(
          `${supabaseUrl}/functions/v1/process-billing-notifications`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              to: employee.email,
              subject: template.subject,
              content: template.content,
              recipientName: employee.name,
              billingValue: 0, // This would be replaced with actual value if available
              dueDate: new Date().toISOString(),
              currentInstallment: 1,
              totalInstallments: 1,
              description: `Notificação mensal para ${employee.name}`
            })
          }
        );
        
        const emailResult = await emailResponse.json();
        console.log(`Email response for ${employee.name}:`, emailResult);
        
        results.push({
          employee: employee.name,
          email: employee.email,
          success: !emailResult.error,
          error: emailResult.error
        });
        
        if (!emailResult.error) {
          sentCount++;
        }
      } catch (emailError) {
        console.error(`Error sending email to ${employee.email}:`, emailError);
        results.push({
          employee: employee.name,
          email: employee.email,
          success: false,
          error: emailError instanceof Error ? emailError.message : String(emailError)
        });
      }
    }
    
    return new Response(
      JSON.stringify({
        message: `Processed ${employees?.length || 0} employees, sent ${sentCount} emails`,
        results
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
    
  } catch (error) {
    console.error("Error processing employee notifications:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
