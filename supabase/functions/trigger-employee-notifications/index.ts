
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
    
    // Get the current date and time
    const now = new Date();
    const currentDay = now.getDate();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Get the email settings
    const { data: settings, error: settingsError } = await supabase
      .from("global_settings")
      .select("employee_emails_send_day")
      .single();
    
    if (settingsError) {
      throw new Error(`Error fetching settings: ${settingsError.message}`);
    }

    // Get the notification time settings
    const { data: timeSettings, error: timeError } = await supabase
      .from("email_notification_settings")
      .select("notification_time")
      .single();
    
    if (timeError && timeError.code !== "PGRST116") {
      throw new Error(`Error fetching time settings: ${timeError.message}`);
    }

    const emailSendDay = settings?.employee_emails_send_day || 5;
    
    // Parse the notification time (HH:MM:SS format)
    const notificationTime = timeSettings?.notification_time || "09:00:00";
    const [sendHour, sendMinute] = notificationTime.split(":").map(Number);
    
    console.log(`Current day: ${currentDay}, Email send day: ${emailSendDay}`);
    console.log(`Current time: ${currentHour}:${currentMinute}, Send time: ${sendHour}:${sendMinute}`);
    
    // Only continue if the current day matches the configured send day
    // and the current time is within 5 minutes of the configured send time
    const isCorrectDay = currentDay === emailSendDay;
    const isCorrectTimeWindow = 
      Math.abs(currentHour - sendHour) * 60 + Math.abs(currentMinute - sendMinute) <= 5;
    
    if (!isCorrectDay || !isCorrectTimeWindow) {
      return new Response(
        JSON.stringify({ 
          message: `Not sending emails now. Current day/time: ${currentDay} at ${currentHour}:${currentMinute}, ` +
                  `Send day/time: ${emailSendDay} at ${sendHour}:${sendMinute}`,
          matchDay: isCorrectDay,
          matchTime: isCorrectTimeWindow
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    // Fetch email templates
    const { data: templates, error: templatesError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("type", "employees")
      .eq("is_default", true);
      
    if (templatesError) {
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
      throw new Error(`Error fetching employees: ${employeesError.message}`);
    }
    
    // Count of successfully sent emails
    let sentCount = 0;
    const results = [];
    
    // Send emails to each employee based on their type (invoice or hours)
    for (const employee of employees) {
      const templateType = employee.type === "freelancer" ? "invoice" : "hours";
      const template = templateMap[templateType];
      
      if (!template) {
        console.log(`No template found for employee type: ${templateType}`);
        continue;
      }
      
      try {
        // Call the process-billing-notifications function to format and send the email
        const emailResponse = await fetch(
          "https://itlpvpdwgiwbdpqheemw.supabase.co/functions/v1/process-billing-notifications",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": req.headers.get("Authorization") || ""
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
        console.log(`Email sent to ${employee.name} (${employee.email}):`, emailResult);
        
        results.push({
          employee: employee.name,
          email: employee.email,
          success: !emailResult.error,
          error: emailResult.error
        });
        
        if (!emailResult.error) {
          sentCount++;
        }
      } catch (emailError: any) {
        console.error(`Error sending email to ${employee.email}:`, emailError);
        results.push({
          employee: employee.name,
          email: employee.email,
          success: false,
          error: emailError.message
        });
      }
    }
    
    return new Response(
      JSON.stringify({
        message: `Processed ${employees.length} employees, sent ${sentCount} emails`,
        results
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
    
  } catch (error: any) {
    console.error("Error processing employee notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
