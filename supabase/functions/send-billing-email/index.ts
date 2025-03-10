
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
      // Send the email
      const emailResponse = await resend.emails.send({
        from: "financeiro@flowcode.cc",
        to: [data.to],
        subject: processedSubject,
        html: htmlContent,
      });

      // Add to cache to prevent duplicates
      recordEmailSent(cacheKey);
      
      console.log("✅ Email sent successfully:", JSON.stringify(emailResponse));

      // Return a response with the expected structure
      return new Response(JSON.stringify({ 
        status: "success", 
        content: emailResponse  // Always include the 'content' field
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (emailError: any) {
      console.error("❌ Resend API error:", emailError);
      console.error("- Error code:", emailError.statusCode);
      console.error("- Error message:", emailError.message);
      
      // Return a response with the expected structure even for errors
      return new Response(
        JSON.stringify({ 
          status: "error", 
          content: {
            statusCode: emailError.statusCode,
            message: emailError.message
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error: any) {
    console.error("❌ General error sending email:", error);
    
    // Return a response with the expected structure even for general errors
    return new Response(
      JSON.stringify({ 
        status: "error", 
        content: { error: error.toString() }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
