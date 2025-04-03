
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
  to?: string;
  subject?: string;
  content?: string;
  templateId?: string;
  data?: {
    recipientName: string;
    responsibleName?: string;
    billingValue: number;
    dueDate: string;
    daysUntilDue: number;
    currentInstallment?: number;
    totalInstallments?: number;
    paymentMethod?: string;
    descricaoServico?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📨 Received email request");
    console.log("🔑 ResendAPI Key available:", !!resendApiKey);
    
    const requestData: EmailRequest = await req.json();
    
    let subject = '';
    let content = '';
    let to = requestData.to;
    let emailData: EmailData;
    
    // Check if we're using template ID or direct content
    if (requestData.templateId) {
      console.log(`🔍 Using template ID: ${requestData.templateId}`);
      
      // Initialize Supabase client to fetch the template
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase configuration");
      }
      
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.43.2");
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Fetch the template
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', requestData.templateId)
        .single();
      
      if (templateError) {
        console.error("❌ Error fetching template:", templateError);
        throw new Error(`Failed to fetch template: ${templateError.message}`);
      }
      
      if (!template) {
        throw new Error(`Template with ID ${requestData.templateId} not found`);
      }
      
      console.log(`📄 Found template: ${template.name}`);
      
      subject = template.subject;
      content = template.content;
      emailData = requestData.data || {};
    } else {
      // Legacy direct content method
      subject = requestData.subject || '';
      content = requestData.content || '';
      emailData = requestData.data || {
        recipientName: '',
        billingValue: 0,
        dueDate: '',
        daysUntilDue: 0
      };
    }
    
    if (!to) {
      throw new Error("Recipient email (to) is required");
    }
    
    // Generate a cache key based on recipient, date, and content
    const cacheKey = generateCacheKey(
      to, 
      emailData.dueDate, 
      emailData.currentInstallment || 1, 
      emailData.daysUntilDue
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
    
    console.log(`📧 Preparing email to: ${to}`);
    
    // Process email content and subject
    const processedContent = processEmailContent(content, emailData);
    const processedSubject = processEmailSubject(subject, emailData);
    
    // Convert to HTML
    const htmlContent = convertToHtml(processedContent);
    
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
        to: [to],
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
