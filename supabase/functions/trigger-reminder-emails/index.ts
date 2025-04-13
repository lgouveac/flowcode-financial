
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://itlpvpdwgiwbdpqheemw.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

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
    console.log("🕒 Checking if reminder emails should be sent...");
    
    // Get reminder settings
    const { data: settings, error: settingsError } = await supabase
      .from("payment_reminder_settings")
      .select("*")
      .single();
    
    if (settingsError) {
      console.error("Error fetching reminder settings:", settingsError);
      throw new Error("Failed to get reminder settings");
    }
    
    // Check if reminders are enabled
    if (!settings.active) {
      console.log("Reminder emails are disabled. Skipping...");
      return new Response(JSON.stringify({ message: "Reminder emails are disabled" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Check if it's time to send reminders
    const currentTime = new Date().toTimeString().substring(0, 5); // HH:MM
    const scheduledTime = settings.notification_time.substring(0, 5);
    
    // Time window of 5 minutes
    const currentMinutes = parseInt(currentTime.substring(0, 2)) * 60 + parseInt(currentTime.substring(3, 5));
    const scheduledMinutes = parseInt(scheduledTime.substring(0, 2)) * 60 + parseInt(scheduledTime.substring(3, 5));
    
    if (Math.abs(currentMinutes - scheduledMinutes) > 5) {
      console.log(`Not time to send reminders yet. Current: ${currentTime}, Scheduled: ${scheduledTime}`);
      return new Response(JSON.stringify({ message: "Not time to send reminders" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Check if we should send reminders today based on the interval
    const { data: lastLog, error: lastLogError } = await supabase
      .from("payment_reminder_log")
      .select("sent_at")
      .order("sent_at", { ascending: false })
      .limit(1);
    
    if (!lastLogError && lastLog && lastLog.length > 0) {
      const lastSentDate = new Date(lastLog[0].sent_at);
      const today = new Date();
      const daysSinceLastSent = Math.floor((today.getTime() - lastSentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastSent < settings.days_interval) {
        console.log(`Last reminders sent ${daysSinceLastSent} days ago. Interval is ${settings.days_interval} days. Skipping...`);
        return new Response(JSON.stringify({ 
          message: `Last reminders sent ${daysSinceLastSent} days ago. Waiting for interval of ${settings.days_interval} days.` 
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }
    
    console.log("✅ Conditions met! Triggering payment reminder emails...");
    
    // Call the send-reminder-email function to handle the actual sending
    const response = await fetch(`${supabaseUrl}/functions/v1/send-reminder-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({})
    });
    
    const result = await response.json();
    
    return new Response(JSON.stringify({
      message: "Payment reminder emails triggered",
      result
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ Error in trigger-reminder-emails function:", error);
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
