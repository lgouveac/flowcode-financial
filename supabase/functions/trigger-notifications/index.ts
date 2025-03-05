
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

    console.log("🔍 Debug: Checking environment variables");
    console.log("- SUPABASE_URL available:", !!supabaseUrl);
    console.log("- SUPABASE_SERVICE_ROLE_KEY available:", !!supabaseKey);
    console.log("- RESEND_API_KEY available:", !!Deno.env.get("RESEND_API_KEY"));

    // Get notification settings for debugging
    console.log("🔍 Debug: Fetching notification settings");
    const { data: settingsData, error: settingsError } = await supabase
      .from('email_notification_settings')
      .select('*');
    
    if (settingsError) {
      console.error("❌ Error fetching notification settings:", settingsError);
    } else {
      console.log("✅ Notification settings:", settingsData);
    }

    // Get notification intervals for debugging
    console.log("🔍 Debug: Fetching notification intervals");
    const { data: intervalsData, error: intervalsError } = await supabase
      .from('email_notification_intervals')
      .select('*');
    
    if (intervalsError) {
      console.error("❌ Error fetching notification intervals:", intervalsError);
    } else {
      console.log("✅ Notification intervals:", intervalsData);
    }

    // Get default template for debugging
    console.log("🔍 Debug: Fetching default template");
    const { data: templateData, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('type', 'clients')
      .eq('subtype', 'recurring')
      .eq('is_default', true)
      .limit(1);
    
    if (templateError) {
      console.error("❌ Error fetching default template:", templateError);
    } else if (!templateData || templateData.length === 0) {
      console.error("❌ No default template found");
    } else {
      console.log("✅ Default template found:", templateData[0].id);
    }

    // Explicitly run the notification function
    console.log("🔄 Calling check_billing_notifications function...");
    const { data, error } = await supabase.rpc('check_billing_notifications');
    
    if (error) {
      console.error("❌ Error running notification function:", error);
      throw error;
    }

    console.log("✅ Successfully triggered notification check");
    
    return new Response(JSON.stringify({ 
      status: "success", 
      message: "Notification check triggered successfully",
      timestamp: new Date().toISOString()
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
