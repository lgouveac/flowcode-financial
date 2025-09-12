
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
    
    // Get notification settings
    console.log("🔍 Fetching notification settings");
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
    
    // Check if current time matches notification time with a 2-minute window
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
    const timeDifference = Math.abs(currentTimeMinutes - dbTimeMinutes);
    const isTimeMatch = timeDifference <= 2 || timeDifference >= 1438; // 1440-2=1438 (handles day boundary)
    
    console.log(`⏰ Time difference: ${timeDifference} minutes, Time match: ${isTimeMatch ? "YES" : "NO"}`);
    
    // IMPORTANT: Only proceed with emails if time matches
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

    // Instead of calling the database function, we'll handle the logic directly here
    // to ensure we have better control and debugging capabilities
    const { data: intervals, error: intervalsError } = await supabase
      .from('email_notification_intervals')
      .select('*');
      
    if (intervalsError) {
      console.error("❌ Error fetching notification intervals:", intervalsError);
      throw new Error(`Failed to fetch notification intervals: ${intervalsError.message}`);
    }
    
    // Process for recurring billing notifications
    const emailsSentRecurring = await processRecurringBillingNotifications(supabase, intervals);
    
    // Process for one-time payment notifications
    const emailsSentOneTime = await processOneTimePaymentNotifications(supabase, intervals);
    
    const totalEmailsSent = emailsSentRecurring + emailsSentOneTime;
    
    return new Response(JSON.stringify({ 
      status: "success", 
      message: "Notification check triggered successfully",
      timestamp: new Date().toISOString(),
      settings: settingsData,
      timeMatched: true,
      currentTime: currentTimeString,
      configuredTime: dbTimeString,
      timeDifferenceMinutes: timeDifference,
      emailsSent: totalEmailsSent,
      emailsSentRecurring: emailsSentRecurring,
      emailsSentOneTime: emailsSentOneTime
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

// Process recurring billing notifications
async function processRecurringBillingNotifications(supabase: any, intervals: any[]) {
  // Get the default template for recurring billing
  const { data: recurringTemplate, error: templateError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('type', 'clients')
    .eq('subtype', 'recurring')
    .eq('is_default', true)
    .single();
    
  if (templateError) {
    console.error("❌ Error fetching recurring email template:", templateError);
    throw new Error(`Failed to fetch recurring email template: ${templateError.message}`);
  }
  
  // Get all pending recurring billings with client information
  const { data: billings, error: billingsError } = await supabase
    .from('recurring_billing')
    .select(`
      *,
      clients!inner (
        id,
        name,
        email,
        responsible_name,
        partner_name
      )
    `)
    .eq('status', 'pending');
    
  if (billingsError) {
    console.error("❌ Error fetching recurring billings:", billingsError);
    throw new Error(`Failed to fetch recurring billings: ${billingsError.message}`);
  }
  
  console.log(`📊 Found ${billings.length} pending recurring billings and ${intervals.length} notification intervals`);
  
  // Current date for comparison
  const currentDate = new Date();
  const todayStr = currentDate.toISOString().split('T')[0];
  let emailsSent = 0;
  
  // Process each billing and interval
  for (const billing of billings) {
    // Calculate the due date for this billing
    // First create the date for this month with the billing due day
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-indexed
    
    // Create date object for due day this month
    let dueDate = new Date(currentYear, currentMonth, billing.due_day);
    
    // If the day has passed this month, use next month
    if (dueDate < currentDate) {
      dueDate = new Date(currentYear, currentMonth + 1, billing.due_day);
    }
    
    const dueDateStr = dueDate.toISOString().split('T')[0];
    
    console.log(`🔍 Checking recurring billing for ${billing.clients.name}, due on ${dueDateStr}`);
    
    // For each notification interval
    for (const interval of intervals) {
      // Calculate notification date (X days before due date)
      const notificationDate = new Date(dueDate);
      notificationDate.setDate(notificationDate.getDate() - interval.days_before);
      const notificationDateStr = notificationDate.toISOString().split('T')[0];
      
      // Check if today is the notification date
      if (notificationDateStr === todayStr) {
        console.log(`✅ Today (${todayStr}) matches notification date for ${billing.clients.name} - ${interval.days_before} days before due date (${dueDateStr})`);
        
        // Check if we've already sent this notification today
        const { data: existingLog, error: logError } = await supabase
          .from('email_notification_log')
          .select('*')
          .eq('billing_id', billing.id)
          .eq('days_before', interval.days_before)
          .eq('notification_date', todayStr)
          .maybeSingle();
          
        if (logError) {
          console.error(`❌ Error checking notification log for ${billing.clients.name}:`, logError);
          continue;
        }
        
        // Skip if already sent today
        if (existingLog) {
          console.log(`⏭️ Already sent notification to ${billing.clients.name} today for this interval`);
          continue;
        }
        
        // Prepare payment method string
        let paymentMethodStr = 'PIX';
        if (billing.payment_method === 'boleto') paymentMethodStr = 'Boleto';
        if (billing.payment_method === 'credit_card') paymentMethodStr = 'Cartão de Crédito';
        
        // Determine responsible name (use responsible_name if available, otherwise partner_name)
        const responsibleName = billing.clients.responsible_name || billing.clients.partner_name || 'Responsável';
        
        // Send the email
        try {
          const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
            'send-billing-email',
            {
              body: JSON.stringify({
                to: billing.clients.email,
                subject: recurringTemplate.subject,
                content: recurringTemplate.content,
                recipientName: billing.clients.name,
                responsibleName: responsibleName,
                billingValue: billing.amount,
                dueDate: dueDateStr,
                daysUntilDue: interval.days_before,
                currentInstallment: billing.current_installment || 1,
                totalInstallments: billing.installments || 1,
                paymentMethod: paymentMethodStr
              })
            }
          );
          
          if (emailError) {
            console.error(`❌ Error sending email to ${billing.clients.name}:`, emailError);
            continue;
          }
          
          console.log(`📧 Successfully sent recurring billing email to ${billing.clients.name}`);
          emailsSent++;
          
          // Log the notification
          const { error: insertError } = await supabase
            .from('email_notification_log')
            .insert({
              billing_id: billing.id,
              client_id: billing.client_id,
              days_before: interval.days_before,
              notification_date: todayStr,
              due_date: dueDateStr,
              email: billing.clients.email
            });
            
          if (insertError) {
            console.error(`❌ Error logging notification for ${billing.clients.name}:`, insertError);
          }
        } catch (error) {
          console.error(`❌ Exception sending email to ${billing.clients.name}:`, error);
        }
      } else {
        console.log(`⏭️ Today (${todayStr}) does not match notification date (${notificationDateStr}) for ${billing.clients.name}`);
      }
    }
  }
  
  return emailsSent;
}

// Process one-time payment notifications
async function processOneTimePaymentNotifications(supabase: any, intervals: any[]) {
  // Try to get the default template for one-time payments, but don't abort if not found
  // We'll use the recurring template as fallback if needed
  const { data: oneTimeTemplate, error: templateError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('type', 'clients')
    .eq('subtype', 'oneTime')
    .eq('is_default', true)
    .single();
    
  if (templateError) {
    console.log("⚠️ No default one-time email template found, will attempt to use recurring template as fallback");
    
    // Get the default recurring template as fallback
    const { data: recurringTemplate, error: recurringError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('type', 'clients')
      .eq('subtype', 'recurring')
      .eq('is_default', true)
      .single();
    
    if (recurringError) {
      console.error("❌ Error fetching fallback template:", recurringError);
      console.log("⚠️ Skipping one-time payment notifications due to missing templates");
      return 0;
    }
    
    // Use recurring template as fallback
    console.log("✅ Will use recurring template as fallback for one-time payments");
    var templateToUse = recurringTemplate;
  } else {
    var templateToUse = oneTimeTemplate;
    console.log("✅ Found default one-time payment template");
  }
  
  // Get all pending one-time payments with client information
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select(`
      *,
      clients!inner (
        id,
        name,
        email,
        responsible_name,
        partner_name
      )
    `)
    .eq('status', 'pending');
    
  if (paymentsError) {
    console.error("❌ Error fetching one-time payments:", paymentsError);
    throw new Error(`Failed to fetch one-time payments: ${paymentsError.message}`);
  }
  
  console.log(`📊 Found ${payments.length} pending one-time payments and ${intervals.length} notification intervals`);
  
  // Current date for comparison
  const currentDate = new Date();
  const todayStr = currentDate.toISOString().split('T')[0];
  let emailsSent = 0;
  
  // Process each payment
  for (const payment of payments) {
    // Get the due date from the payment record
    const dueDate = new Date(payment.due_date);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    
    console.log(`🔍 Checking one-time payment for ${payment.clients.name}, due on ${dueDateStr}`);
    
    // For each notification interval
    for (const interval of intervals) {
      // Calculate notification date (X days before due date)
      const notificationDate = new Date(dueDate);
      notificationDate.setDate(notificationDate.getDate() - interval.days_before);
      const notificationDateStr = notificationDate.toISOString().split('T')[0];
      
      // Check if today is the notification date
      if (notificationDateStr === todayStr) {
        console.log(`✅ Today (${todayStr}) matches notification date for one-time payment to ${payment.clients.name} - ${interval.days_before} days before due date (${dueDateStr})`);
        
        // Check if we've already sent this notification today
        const { data: existingLog, error: logError } = await supabase
          .from('email_notification_log')
          .select('*')
          .eq('payment_id', payment.id)
          .eq('days_before', interval.days_before)
          .eq('notification_date', todayStr)
          .maybeSingle();
          
        if (logError) {
          console.error(`❌ Error checking notification log for ${payment.clients.name}:`, logError);
          continue;
        }
        
        // Skip if already sent today
        if (existingLog) {
          console.log(`⏭️ Already sent notification to ${payment.clients.name} today for this interval`);
          continue;
        }
        
        // Prepare payment method string
        let paymentMethodStr = 'PIX';
        if (payment.payment_method === 'boleto') paymentMethodStr = 'Boleto';
        if (payment.payment_method === 'credit_card') paymentMethodStr = 'Cartão de Crédito';
        
        // Determine responsible name (use responsible_name if available, otherwise partner_name)
        const responsibleName = payment.clients.responsible_name || payment.clients.partner_name || 'Responsável';
        
        // Send the email
        try {
          const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
            'send-billing-email',
            {
              body: JSON.stringify({
                to: payment.clients.email,
                subject: templateToUse.subject,
                content: templateToUse.content,
                recipientName: payment.clients.name,
                responsibleName: responsibleName,
                billingValue: payment.amount,
                dueDate: dueDateStr,
                daysUntilDue: interval.days_before,
                paymentMethod: paymentMethodStr,
                descricaoServico: payment.description
              })
            }
          );
          
          if (emailError) {
            console.error(`❌ Error sending email to ${payment.clients.name}:`, emailError);
            continue;
          }
          
          console.log(`📧 Successfully sent one-time payment email to ${payment.clients.name}`);
          emailsSent++;
          
          // Log the notification
          const { error: insertError } = await supabase
            .from('email_notification_log')
            .insert({
              payment_id: payment.id,
              client_id: payment.client_id,
              days_before: interval.days_before,
              notification_date: todayStr,
              due_date: dueDateStr,
              email: payment.clients.email,
              payment_type: 'oneTime'
            });
            
          if (insertError) {
            console.error(`❌ Error logging notification log for ${payment.clients.name}:`, insertError);
          }
        } catch (error) {
          console.error(`❌ Exception sending email to ${payment.clients.name}:`, error);
        }
      } else {
        console.log(`⏭️ Today (${todayStr}) does not match notification date (${notificationDateStr}) for ${payment.clients.name}`);
      }
    }
  }
  
  return emailsSent;
}

serve(handler);
