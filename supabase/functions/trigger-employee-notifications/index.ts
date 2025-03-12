
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    
    // Call the Supabase PostgreSQL function
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://itlpvpdwgiwbdpqheemw.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseKey) {
      console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    }

    console.log("📊 Preparing to call check_employee_notifications function");
    
    // Execute the check_employee_notifications PostgreSQL function
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/check_employee_notifications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Database function error: ${response.status} - ${errorText}`);
      throw new Error(`Error calling check_employee_notifications: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Employee notification trigger result:", result);

    return new Response(
      JSON.stringify({ success: true, message: "Employee notifications triggered", result }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error triggering employee notifications:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
