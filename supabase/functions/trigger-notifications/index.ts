
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

    // Get notification settings for debugging
    console.log("🔍 Debug: Fetching notification settings");
    const { data: settingsData, error: settingsError } = await supabase
      .from('email_notification_settings')
      .select('*');
    
    if (settingsError) {
      console.error("❌ Error fetching notification settings:", settingsError);
      throw new Error(`Failed to fetch notification settings: ${settingsError.message}`);
    } else if (!settingsData || settingsData.length === 0) {
      console.error("❌ No notification settings found");
      throw new Error("No notification settings found. Please create notification settings first.");
    } else {
      console.log("✅ Notification settings:", settingsData);
    }

    // Get notification intervals for debugging
    console.log("🔍 Debug: Fetching notification intervals");
    const { data: intervalsData, error: intervalsError } = await supabase
      .from('email_notification_intervals')
      .select('*')
      .order('days_before', { ascending: false });
    
    if (intervalsError) {
      console.error("❌ Error fetching notification intervals:", intervalsError);
      throw new Error(`Failed to fetch notification intervals: ${intervalsError.message}`);
    } else if (!intervalsData || intervalsData.length === 0) {
      console.error("❌ No notification intervals found");
      console.log("⚠️ Creating a default notification interval (7 days before)");
      
      // Create a default interval if none exists
      const { error: createError } = await supabase
        .from('email_notification_intervals')
        .insert({ days_before: 7 });
        
      if (createError) {
        console.error("❌ Failed to create default interval:", createError);
      } else {
        console.log("✅ Default interval created successfully");
      }
    } else {
      console.log("✅ Found", intervalsData.length, "notification intervals:", intervalsData);
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

    // Check if there are any pending billings
    console.log("🔍 Debug: Checking for pending billings");
    const { data: pendingBillings, error: billingError } = await supabase
      .from('recurring_billing')
      .select('*, clients(name, email)')
      .eq('status', 'pending');
      
    if (billingError) {
      console.error("❌ Error fetching pending billings:", billingError);
    } else if (!pendingBillings || pendingBillings.length === 0) {
      console.log("⚠️ No pending billings found. This might be why no emails are sent.");
    } else {
      console.log("✅ Found", pendingBillings.length, "pending billings");
      
      // Calculate which billings should receive notifications today based on the intervals
      if (intervalsData && intervalsData.length > 0 && pendingBillings.length > 0) {
        console.log("🔍 Analyzing which billings should receive notifications today...");
        const today = new Date();
        
        for (const billing of pendingBillings) {
          const dueDay = billing.due_day;
          if (!dueDay) continue;
          
          // Create a date object for the due day in the current month
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();
          const dueDateObj = new Date(currentYear, currentMonth, dueDay);
          
          // If due day already passed this month, check next month
          if (dueDateObj < today) {
            dueDateObj.setMonth(dueDateObj.getMonth() + 1);
          }
          
          for (const interval of intervalsData) {
            const notificationDate = new Date(dueDateObj);
            notificationDate.setDate(notificationDate.getDate() - interval.days_before);
            
            const isToday = 
              notificationDate.getDate() === today.getDate() && 
              notificationDate.getMonth() === today.getMonth() && 
              notificationDate.getFullYear() === today.getFullYear();
            
            if (isToday) {
              console.log(`📅 Billing ${billing.id} (${billing.description}) should be notified today (${interval.days_before} days before due date ${dueDateObj.toLocaleDateString()})`);
            }
          }
        }
      }
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
      timestamp: new Date().toISOString(),
      settings: settingsData,
      intervals: intervalsData,
      template: templateData && templateData.length > 0 ? templateData[0] : null,
      pendingBillings: pendingBillings ? pendingBillings.length : 0
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
