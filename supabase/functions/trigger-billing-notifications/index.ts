
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
    console.log("Starting billing notifications direct edge function");
    
    // Initialize Supabase client using service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseKey) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for pending notifications
    const { data: settings } = await supabase
      .from('email_notification_settings')
      .select('notification_time')
      .single();

    if (!settings) {
      console.log("No email notification settings found");
      return new Response(
        JSON.stringify({ success: true, message: "No notification settings found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log("Found notification settings with time:", settings.notification_time);
    
    // Get all notification intervals
    const { data: intervals } = await supabase
      .from('email_notification_intervals')
      .select('*');
    
    if (!intervals || intervals.length === 0) {
      console.log("No notification intervals configured");
      return new Response(
        JSON.stringify({ success: true, message: "No notification intervals configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    // Get default email template for recurring billing
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('type', 'clients')
      .eq('subtype', 'recurring')
      .eq('is_default', true)
      .single();
    
    if (!template) {
      console.log("No default template found for recurring billing");
      return new Response(
        JSON.stringify({ success: true, message: "No default template found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    console.log("Found default template:", template.name);
    
    // Process pending billings
    let notificationsSent = 0;
    
    for (const interval of intervals) {
      // Get the proper date for this interval
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + interval.days_before);
      
      // Find pending billings due in days_before days
      const { data: billings } = await supabase
        .from('recurring_billing')
        .select(`
          *,
          clients:client_id (
            id, name, email, responsible_name, partner_name
          )
        `)
        .eq('status', 'pending');
      
      if (!billings || billings.length === 0) {
        console.log(`No pending billings found for interval: ${interval.days_before} days`);
        continue;
      }
      
      console.log(`Found ${billings.length} pending billings for interval: ${interval.days_before} days`);
      
      // Process each billing
      for (const billing of billings) {
        // Calculate the due date for this month
        const today = new Date();
        let dueDate = new Date(today.getFullYear(), today.getMonth(), billing.due_day);
        
        // If the due day has passed this month, use next month
        if (dueDate < today) {
          dueDate = new Date(today.getFullYear(), today.getMonth() + 1, billing.due_day);
        }
        
        // Check if notification should be sent today for this billing
        const notificationDate = new Date(dueDate);
        notificationDate.setDate(notificationDate.getDate() - interval.days_before);
        
        const currentDate = new Date();
        if (
          notificationDate.getDate() !== currentDate.getDate() ||
          notificationDate.getMonth() !== currentDate.getMonth() ||
          notificationDate.getFullYear() !== currentDate.getFullYear()
        ) {
          continue;
        }
        
        console.log(`Sending notification for billing ${billing.id} due on ${dueDate.toISOString()}`);
        
        const client = billing.clients;
        if (!client || !client.email) {
          console.error("Client information missing for billing:", billing.id);
          continue;
        }
        
        // Prepare payment method text
        let paymentMethodStr = 'PIX';
        if (billing.payment_method === 'boleto') paymentMethodStr = 'Boleto';
        if (billing.payment_method === 'credit_card') paymentMethodStr = 'Cartão de Crédito';
        
        // Calculate days until due
        const daysUntilDue = interval.days_before;
        
        // Determine responsible name - THIS IS THE CRITICAL FIX
        const responsibleName = client.responsible_name || client.partner_name || "Responsável";
        console.log("Using responsible name:", responsibleName);
        
        console.log("Sending email with data:", {
          to: client.email,
          templateId: template.id,
          data: {
            recipientName: client.name,
            responsibleName: responsibleName,
            billingValue: billing.amount,
            dueDate: dueDate.toISOString(),
            daysUntilDue: daysUntilDue,
            currentInstallment: billing.current_installment,
            totalInstallments: billing.installments,
            descricaoServico: billing.description,
            paymentMethod: paymentMethodStr
          }
        });
        
        // Extra details for debug
        console.log(`Current installment: ${billing.current_installment || 1}`);
        console.log(`Total installments: ${billing.installments || 1}`);
        
        // Send the email notification
        try {
          const { error: emailError } = await supabase.functions.invoke(
            'send-billing-email',
            {
              body: JSON.stringify({
                to: client.email,
                templateId: template.id,
                data: {
                  recipientName: client.name,
                  responsibleName: responsibleName,
                  billingValue: billing.amount,
                  dueDate: dueDate.toISOString(),
                  daysUntilDue: daysUntilDue,
                  currentInstallment: billing.current_installment || 1,
                  totalInstallments: billing.installments || 1,
                  descricaoServico: billing.description,
                  paymentMethod: paymentMethodStr
                }
              })
            }
          );
          
          if (emailError) {
            console.error(`Error sending email for billing ${billing.id}:`, emailError);
            continue;
          }
          
          // Log the notification
          const { error: logError } = await supabase
            .from('email_notification_log')
            .insert({
              payment_id: null,
              client_id: billing.client_id,
              days_before: daysUntilDue,
              due_date: dueDate.toISOString().split('T')[0],
              payment_type: 'recurring',
              billing_id: billing.id,
              sent_at: new Date().toISOString()
            });
            
          if (logError) {
            console.error(`Error logging notification for billing ${billing.id}:`, logError);
          } else {
            notificationsSent++;
            console.log(`Successfully sent and logged notification for billing ${billing.id}`);
          }
        } catch (e) {
          console.error(`Exception sending email for billing ${billing.id}:`, e);
        }
      }
    }
    
    console.log(`Notifications process completed. Sent ${notificationsSent} notifications.`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Billing notifications triggered successfully`,
        sentCount: notificationsSent
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error triggering billing notifications:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
