
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { 
  corsHeaders, 
  setupCacheCleanup, 
  generateCacheKey,
  isDuplicateEmail, 
  recordEmailSent
} from "./utils.ts";
import { 
  processEmailContent, 
  processEmailSubject, 
  convertToHtml,
  EmailData 
} from "./email-formatter.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(resendApiKey);

// Initialize the cache cleanup interval
setupCacheCleanup();

interface EmailRequest {
  to: string;
  subject: string;
  content: string;
  recipientName: string;
  responsibleName?: string;
  billingValue: number;
  dueDate: string;
  daysUntilDue: number;
  currentInstallment?: number;
  totalInstallments?: number;
  paymentMethod?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📨 Received email request");
    console.log("🔑 ResendAPI Key available:", !!resendApiKey);
    
    const data: EmailRequest = await req.json();
    console.log("📝 Request data:", JSON.stringify({
      to: data.to,
      subject: data.subject,
      recipientName: data.recipientName,
      responsibleName: data.responsibleName,
      billingValue: data.billingValue,
      dueDate: data.dueDate,
      daysUntilDue: data.daysUntilDue,
      currentInstallment: data.currentInstallment || 1,
      totalInstallments: data.totalInstallments || 1,
      paymentMethod: data.paymentMethod || 'PIX'
    }));
    
    // Generate a cache key based on recipient, date, and content
    const cacheKey = generateCacheKey(
      data.to, 
      data.dueDate, 
      data.currentInstallment || 1, 
      data.daysUntilDue
    );
    
    // Check if we've sent this email recently
    const { isDuplicate, timeSince } = isDuplicateEmail(cacheKey);
    if (isDuplicate) {
      console.log(`⚠️ Duplicate email detected for ${cacheKey}, sent ${timeSince}ms ago. Skipping.`);
      return new Response(JSON.stringify({ 
        status: "success", 
        message: "Email skipped (duplicate)",
        content: { duplicateKey: cacheKey, lastSentMs: timeSince }
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }
    
    // Normalize data for email processing
    const emailData: EmailData = {
      recipientName: data.recipientName,
      responsibleName: data.responsibleName,
      billingValue: data.billingValue,
      dueDate: data.dueDate,
      currentInstallment: typeof data.currentInstallment === 'number' ? data.currentInstallment : 1,
      totalInstallments: typeof data.totalInstallments === 'number' ? data.totalInstallments : 1,
      paymentMethod: data.paymentMethod || 'PIX'
    };
    
    // Process email content and subject
    const processedContent = processEmailContent(data.content, emailData);
    const processedSubject = processEmailSubject(data.subject, emailData);
    
    // Convert to HTML
    const htmlContent = convertToHtml(processedContent);
    
    console.log("📧 Processing email to:", data.to);
    console.log("📋 Subject:", processedSubject);
    
    try {
      // Fetch CC recipients from the database
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://itlpvpdwgiwbdpqheemw.supabase.co";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (!supabaseKey) {
        throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
      }
      
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.43.2");
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Fetch CC recipients
      const { data: ccRecipients, error: ccError } = await supabase
        .from('email_cc_recipients')
        .select('email')
        .eq('is_active', true);
      
      if (ccError) {
        console.error("Error fetching CC recipients:", ccError);
        throw ccError;
      }
      
      // Extract email addresses from CC recipients
      const ccEmails = ccRecipients?.map(recipient => recipient.email) || [];
      console.log("CC recipients:", ccEmails);
      
      // Send email
      const { data: emailResult, error } = await resend.emails.send({
        from: "Financeiro <contato@xpertagro.com>",
        to: [data.to],
        cc: ccEmails,
        subject: processedSubject,
        html: htmlContent,
      });
      
      if (error) {
        console.error("Error sending email:", error);
        throw error;
      }
      
      // Record that we've sent this email
      recordEmailSent(cacheKey);
      
      console.log("✅ Email sent successfully:", emailResult);
      
      return new Response(JSON.stringify({ 
        status: "success", 
        message: "Email sent successfully",
        content: emailResult
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  } catch (error: any) {
    console.error("Error in send-billing-email function:", error);
    
    return new Response(JSON.stringify({ 
      status: "error", 
      message: error.message || "An error occurred while processing the email request.",
      error: error
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
};

serve(handler);
