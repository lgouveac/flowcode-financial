
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

  console.log("🔔 Trigger billing notifications function called");

  try {
    // Get notification time setting
    const { data: settings, error: settingsError } = await supabase
      .from('email_notification_settings')
      .select('notification_time')
      .limit(1);

    if (settingsError) {
      console.error("Error fetching notification settings:", settingsError);
      throw new Error(`Failed to fetch notification settings: ${settingsError.message}`);
    }

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
    
    console.log(`⏰ Current time: ${currentTime}, Notification time: ${notificationHoursMinutes}`);

    // Check if it's time to send notifications (within 5 minutes window)
    const currentHour = parseInt(currentTime.split(':')[0], 10);
    const currentMinute = parseInt(currentTime.split(':')[1], 10);
    const notifHour = parseInt(notificationHoursMinutes.split(':')[0], 10);
    const notifMinute = parseInt(notificationHoursMinutes.split(':')[1], 10);

    // Calculate total minutes for easier comparison
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const notifTotalMinutes = notifHour * 60 + notifMinute;
    const minutesDifference = Math.abs(currentTotalMinutes - notifTotalMinutes);

    if (minutesDifference <= 5) {
      console.log("✅ It's notification time! Calling process-billing-notifications");
      
      // Call the process-billing-notifications function
      const response = await fetch(
        `${supabaseUrl}/functions/v1/process-billing-notifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to call process-billing-notifications: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("📬 Notification processing result:", result);

      return new Response(JSON.stringify({ 
        status: "success", 
        message: "Notifications processed successfully", 
        details: result 
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } else {
      console.log("⏱️ Not notification time yet, skipping");
      return new Response(JSON.stringify({ 
        status: "success", 
        message: "Not notification time yet", 
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
    console.error("❌ Error triggering billing notifications:", error);
    
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
