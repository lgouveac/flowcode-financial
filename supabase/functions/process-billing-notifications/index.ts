
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

// Helper function to format a date to ISO string (YYYY-MM-DD)
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper function to check if a notification was already sent
const wasNotificationSent = async (
  billingId: string, 
  dueDate: string,
  daysBefore: number
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('email_notification_log')
    .select('id')
    .eq('billing_id', billingId)
    .eq('due_date', dueDate)
    .eq('days_before', daysBefore)
    .limit(1);
  
  if (error) {
    console.error("Error checking notification log:", error);
    return false; // Assume not sent if there's an error
  }
  
  return data && data.length > 0;
};

// Record a sent notification to prevent duplicates
const recordNotificationSent = async (
  billingId: string,
  clientId: string, 
  dueDate: string,
  daysBefore: number
): Promise<void> => {
  const { error } = await supabase
    .from('email_notification_log')
    .insert({
      billing_id: billingId,
      client_id: clientId,
      due_date: dueDate,
      days_before: daysBefore,
      sent_at: new Date().toISOString()
    });
  
  if (error) {
    console.error("Error recording notification:", error);
  }
};

// Get payment method display name
const getPaymentMethodDisplay = (method: string): string => {
  switch (method) {
    case 'pix': return 'PIX';
    case 'boleto': return 'Boleto';
    case 'credit_card': return 'Cartão de Crédito';
    default: return 'PIX';
  }
};

// Send notification email
const sendNotificationEmail = async (
  templateData: any,
  clientData: any,
  billingData: any,
  dueDate: string,
  daysBefore: number
): Promise<boolean> => {
  try {
    // Call the send-billing-email function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-billing-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          to: clientData.email,
          subject: templateData.subject,
          content: templateData.content,
          recipientName: clientData.name,
          billingValue: billingData.amount,
          dueDate: dueDate,
          daysUntilDue: daysBefore,
          currentInstallment: billingData.current_installment,
          totalInstallments: billingData.installments,
          paymentMethod: getPaymentMethodDisplay(billingData.payment_method)
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Email sending failed with status ${response.status}:`, errorText);
      return false;
    }

    const result = await response.json();
    console.log(`Email sent to ${clientData.name} (${clientData.email}):`, result);
    return result.status === 'success';
  } catch (error) {
    console.error("Error sending notification email:", error);
    return false;
  }
};

// Process notifications for recurring billings
const processRecurringBillingNotifications = async (): Promise<{
  processed: number;
  sent: number;
  errors: number;
}> => {
  const stats = { processed: 0, sent: 0, errors: 0 };
  const today = new Date();
  const todayStr = formatDate(today);
  
  // Get notification intervals
  const { data: intervals, error: intervalsError } = await supabase
    .from('email_notification_intervals')
    .select('*');
  
  if (intervalsError) {
    console.error("Error fetching notification intervals:", intervalsError);
    return stats;
  }
  
  if (!intervals || intervals.length === 0) {
    console.log("No notification intervals configured");
    return stats;
  }
  
  // Get default email template
  const { data: templates, error: templateError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('type', 'clients')
    .eq('subtype', 'recurring')
    .eq('is_default', true)
    .limit(1);
  
  if (templateError || !templates || templates.length === 0) {
    console.error("Error fetching default template:", templateError);
    return stats;
  }
  
  const defaultTemplate = templates[0];
  
  // Get active recurring billings with client data
  const { data: billings, error: billingsError } = await supabase
    .from('recurring_billing')
    .select(`
      *,
      clients (
        id, name, email
      )
    `)
    .eq('status', 'pending');
  
  if (billingsError) {
    console.error("Error fetching recurring billings:", billingsError);
    return stats;
  }
  
  if (!billings || billings.length === 0) {
    console.log("No active recurring billings found");
    return stats;
  }
  
  console.log(`Processing ${billings.length} recurring billings with ${intervals.length} notification intervals`);
  
  // Process each billing
  for (const billing of billings) {
    try {
      stats.processed++;
      
      if (!billing.clients) {
        console.error(`No client data for billing ${billing.id}`);
        continue;
      }
      
      const clientData = billing.clients;
      
      // Calculate this month's due date based on due_day
      let dueDate = new Date(today.getFullYear(), today.getMonth(), billing.due_day);
      
      // If the due date has passed this month, use next month
      if (dueDate < today) {
        dueDate = new Date(today.getFullYear(), today.getMonth() + 1, billing.due_day);
      }
      
      const dueDateStr = formatDate(dueDate);
      console.log(`Billing ${billing.id} for ${clientData.name} has due date: ${dueDateStr}`);
      
      // Check each notification interval
      for (const interval of intervals) {
        const daysBefore = interval.days_before;
        
        // Calculate when the notification should be sent
        const notificationDate = new Date(dueDate);
        notificationDate.setDate(notificationDate.getDate() - daysBefore);
        const notificationDateStr = formatDate(notificationDate);
        
        // Check if today is the notification date
        if (notificationDateStr === todayStr) {
          console.log(`Today is notification day for billing ${billing.id} (${daysBefore} days before due date)`);
          
          // Check if notification was already sent
          const alreadySent = await wasNotificationSent(billing.id, dueDateStr, daysBefore);
          
          if (alreadySent) {
            console.log(`Notification for billing ${billing.id} due ${dueDateStr} (${daysBefore} days before) already sent`);
            continue;
          }
          
          // Send the notification
          const success = await sendNotificationEmail(
            defaultTemplate,
            clientData,
            billing,
            dueDateStr,
            daysBefore
          );
          
          if (success) {
            stats.sent++;
            console.log(`Successfully sent notification for billing ${billing.id} (${daysBefore} days before)`);
            
            // Record the sent notification
            await recordNotificationSent(billing.id, clientData.id, dueDateStr, daysBefore);
          } else {
            stats.errors++;
            console.error(`Failed to send notification for billing ${billing.id} (${daysBefore} days before)`);
          }
        } else {
          console.log(`Today (${todayStr}) is not notification day (${notificationDateStr}) for billing ${billing.id} (${daysBefore} days before)`);
        }
      }
    } catch (error) {
      stats.errors++;
      console.error(`Error processing billing ${billing.id}:`, error);
    }
  }
  
  return stats;
};

// Main handler function
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  console.log(`📨 Starting billing notification process at ${new Date().toISOString()}`);
  
  try {
    // Process recurring billing notifications
    const stats = await processRecurringBillingNotifications();
    
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;
    
    const result = {
      status: "success",
      message: `Processed ${stats.processed} billings, sent ${stats.sent} notifications with ${stats.errors} errors`,
      executionTime: `${executionTime} seconds`,
      timestamp: new Date().toISOString(),
      stats
    };
    
    console.log(`✅ Notification process completed: ${result.message}`);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error processing notifications:", error);
    
    return new Response(
      JSON.stringify({ 
        status: "error", 
        message: error.toString(),
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
