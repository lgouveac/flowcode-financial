
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client using service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🚀 Starting notification trigger function");
    console.log("🔍 Debug: Checking environment variables");
    console.log("- SUPABASE_URL available:", !!supabaseUrl);
    console.log("- SUPABASE_SERVICE_ROLE_KEY available:", !!supabaseKey);
    console.log("- RESEND_API_KEY available:", !!Deno.env.get("RESEND_API_KEY"));
    console.log("- Request method:", req.method);
    console.log("- Request headers:", JSON.stringify(Object.fromEntries(req.headers)));

    // Log request information
    let requestBody = "{}";
    try {
      if (req.body) {
        const clonedReq = req.clone();
        const bodyText = await clonedReq.text();
        if (bodyText) {
          requestBody = bodyText;
          console.log("- Request body:", bodyText);
        }
      }
    } catch (e) {
      console.log("- Error reading request body:", e.message);
    }

    // Get notification settings
    console.log("🔍 Debug: Fetching notification settings");
    const { data: settingsData, error: settingsError } = await supabase
      .from('email_notification_settings')
      .select('id, notification_time')
      .limit(1);
    
    if (settingsError) {
      console.error("❌ Error fetching notification settings:", settingsError);
      throw new Error(`Failed to fetch notification settings: ${settingsError.message}`);
    } else if (!settingsData || settingsData.length === 0) {
      console.error("❌ No notification settings found");
      throw new Error("No notification settings found. Please create notification settings first.");
    } else {
      console.log("✅ Notification settings:", settingsData);
    }

    // Extract notification time
    const notificationTime = settingsData[0].notification_time;
    
    // Check if current time matches notification time with a 5-minute window
    const now = new Date();
    const currentTimeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const dbTimeString = notificationTime.substring(0, 5); // HH:MM format
    
    console.log(`⏰ Current time: ${currentTimeString}, Notification time: ${dbTimeString}`);
    
    // Convert both times to minutes since midnight for easier comparison
    const currentHour = parseInt(currentTimeString.split(':')[0]);
    const currentMinute = parseInt(currentTimeString.split(':')[1]);
    const dbHour = parseInt(dbTimeString.split(':')[0]);
    const dbMinute = parseInt(dbTimeString.split(':')[1]);
    
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    const dbTimeMinutes = dbHour * 60 + dbMinute;
    
    // Allow a 2-minute window (consider times within 2 minutes as matching)
    // We'll make this stricter than before to avoid sending too many emails
    const timeDifference = Math.abs(currentTimeMinutes - dbTimeMinutes);
    const isTimeMatch = timeDifference <= 2 || timeDifference >= 1438; // 1440-2=1438 (handles day boundary)
    
    console.log(`⏰ Time difference: ${timeDifference} minutes, Time match: ${isTimeMatch ? "YES" : "NO"}`);
    
    // IMPORTANT CHANGE: Only proceed with emails if time matches
    // This was the bug - we were ignoring the time match result
    if (!isTimeMatch) {
      console.log("⏰ Current time does not match notification time. Skipping email sending.");
      return new Response(JSON.stringify({ 
        status: "success", 
        message: "Notification time not matched, no emails sent",
        timestamp: new Date().toISOString(),
        timeMatched: false,
        currentTime: currentTimeString,
        configuredTime: dbTimeString,
        timeDifferenceMinutes: timeDifference
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    console.log("⏰ Time matched! Proceeding with notifications");

    // Execute the database notification function
    console.log("🔄 Executing check_billing_notifications function...");
    const { error: checkError } = await supabase.rpc('check_billing_notifications');
    
    if (checkError) {
      console.error("❌ Error executing check_billing_notifications:", checkError);
      throw new Error(`Failed to execute check_billing_notifications: ${checkError.message}`);
    } else {
      console.log("✅ Successfully executed check_billing_notifications");
    }

    console.log("✅ Successfully triggered notification check");
    
    return new Response(JSON.stringify({ 
      status: "success", 
      message: "Notification check triggered successfully",
      timestamp: new Date().toISOString(),
      settings: settingsData,
      timeMatched: true,
      currentTime: currentTimeString,
      configuredTime: dbTimeString,
      timeDifferenceMinutes: timeDifference
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error triggering notifications:", error);
    return new Response(
      JSON.stringify({ 
        status: "error", 
        message: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
