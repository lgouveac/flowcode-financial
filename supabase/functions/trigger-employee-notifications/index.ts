
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

// CORS headers for the API
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("🔔 Trigger employee notifications function called");

  try {
    // Get employee notification time setting - ONLY use employee_email_settings
    const { data: settings, error: settingsError } = await supabase
      .from('employee_email_settings')
      .select('notification_time')
      .limit(1);

    if (settingsError) {
      console.error("Error fetching employee notification settings:", settingsError);
      throw new Error(`Failed to fetch employee notification settings: ${settingsError.message}`);
    }

    // Default to 09:00 if no settings found
    const notificationTime = settings && settings.length > 0 && settings[0].notification_time 
      ? settings[0].notification_time 
      : '09:00:00';

    // Get current time in HH:MM format
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'UTC'  // Use same timezone as your database
    });

    // Extract hours and minutes from notification time (format: HH:MM:SS)
    const notificationHoursMinutes = notificationTime.substring(0, 5);
    
    console.log(`⏰ Current time: ${currentTime}, Employee notification time: ${notificationHoursMinutes}`);

    // Check if it's time to send notifications (within 5 minutes window)
    const currentHour = parseInt(currentTime.split(':')[0], 10);
    const currentMinute = parseInt(currentTime.split(':')[1], 10);
    const notifHour = parseInt(notificationHoursMinutes.split(':')[0], 10);
    const notifMinute = parseInt(notificationHoursMinutes.split(':')[1], 10);

    // Calculate total minutes for easier comparison
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const notifTotalMinutes = notifHour * 60 + notifMinute;
    const minutesDifference = Math.abs(currentTotalMinutes - notifTotalMinutes);

    // Get the global settings for employee emails send day
    const { data: globalSettings, error: globalError } = await supabase
      .from('global_settings')
      .select('employee_emails_send_day')
      .single();

    if (globalError) {
      console.error("Error fetching global settings:", globalError);
      throw new Error(`Failed to fetch global settings: ${globalError.message}`);
    }

    // Get employee_emails_send_day or default to 5 (5th day of month)
    const emailSendDay = globalSettings?.employee_emails_send_day || 5;
    
    // Check if today is the day to send emails
    const currentDay = now.getDate();
    const shouldSendToday = currentDay === emailSendDay;

    console.log(`📆 Current day: ${currentDay}, Send day: ${emailSendDay}, Should send today: ${shouldSendToday}`);

    if (shouldSendToday && minutesDifference <= 5) {
      console.log("✅ It's employee notification time! Sending employee notifications");
      
      // Get active employees
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, name, email, position')
        .eq('status', 'active');

      if (employeesError) {
        throw new Error(`Failed to fetch employees: ${employeesError.message}`);
      }

      console.log(`👥 Found ${employees?.length || 0} active employees`);

      // Get default employee email template
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('content, subject')
        .eq('type', 'employees')
        .eq('subtype', 'hours')
        .eq('is_default', true)
        .maybeSingle();

      if (templateError) {
        throw new Error(`Failed to fetch template: ${templateError.message}`);
      }

      if (!template) {
        throw new Error("No default employee email template found");
      }

      // For each employee, send email
      for (const employee of employees || []) {
        try {
          console.log(`📧 Sending email to ${employee.name} (${employee.email})`);
          
          // Call the send-email function
          const response = await fetch(
            `${supabaseUrl}/functions/v1/send-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`
              },
              body: JSON.stringify({
                to: employee.email,
                subject: template.subject,
                content: template.content,
                nome_funcionario: employee.name,
              })
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to send email to ${employee.email}: ${response.status} - ${errorText}`);
          } else {
            console.log(`✅ Email sent to ${employee.name} (${employee.email})`);
          }
        } catch (emailError) {
          console.error(`Error sending email to ${employee.email}:`, emailError);
        }
      }

      return new Response(JSON.stringify({ 
        status: "success", 
        message: "Employee notifications processed successfully", 
        employeesCount: employees?.length || 0
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } else {
      console.log("⏱️ Not employee notification time yet, skipping");
      const skipReason = !shouldSendToday 
        ? "Not the right day of month" 
        : "Not the right time of day";
        
      return new Response(JSON.stringify({ 
        status: "success", 
        message: "Not employee notification time yet", 
        reason: skipReason,
        currentDay,
        sendDay: emailSendDay,
        currentTime,
        notificationTime: notificationHoursMinutes,
        minutesDifference
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }
  } catch (error: any) {
    console.error("❌ Error triggering employee notifications:", error);
    
    return new Response(
      JSON.stringify({ 
        status: "error", 
        message: error.toString() 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
