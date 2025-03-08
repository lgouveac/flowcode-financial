
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  content: string;
  recipientName: string;
  billingValue: number;
  dueDate: string;
  daysUntilDue: number;
  currentInstallment?: number;  // Campo para parcela atual
  totalInstallments?: number;   // Campo para total de parcelas
  paymentMethod?: string;       // Método de pagamento
}

// Add a simple in-memory cache to prevent duplicate emails
// This is a basic solution - in production you might want a more robust solution
const emailCache = new Map<string, number>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of emailCache.entries()) {
    if (now - timestamp > CACHE_TTL) {
      emailCache.delete(key);
    }
  }
}, 300000); // Clean every 5 minutes

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
    const cacheKey = `${data.to}-${data.dueDate}-${data.currentInstallment || 1}-${data.daysUntilDue}`;
    
    // Check if we've sent this email recently
    const lastSent = emailCache.get(cacheKey);
    if (lastSent) {
      const timeSince = Date.now() - lastSent;
      // If we sent this email in the last hour, don't send it again
      if (timeSince < CACHE_TTL) {
        console.log(`⚠️ Duplicate email detected for ${cacheKey}, sent ${timeSince}ms ago. Skipping.`);
        return new Response(JSON.stringify({ 
          status: "success", 
          message: "Email skipped (duplicate)",
          details: { duplicateKey: cacheKey, lastSentMs: timeSince }
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }
    }
    
    // Prepare recipients
    const recipients = [data.to];
    
    // Format currency
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(data.billingValue);
    
    // Format date
    const formattedDate = new Date(data.dueDate).toLocaleDateString('pt-BR');
    console.log("📅 Formatted date:", formattedDate);
    
    // Ensure these are defined values with proper type checking, not undefined
    const currentInstallment = typeof data.currentInstallment === 'number' ? data.currentInstallment : 1;
    const totalInstallments = typeof data.totalInstallments === 'number' ? data.totalInstallments : 1;
    const paymentMethod = data.paymentMethod || 'PIX';
    
    console.log("📦 Variable values:", {
      currentInstallment,
      totalInstallments,
      paymentMethod
    });
    
    // Format installment information (e.g., "1/5")
    const installmentInfo = `${currentInstallment}/${totalInstallments}`;
    console.log("📊 Installment info:", installmentInfo);
    
    // Replace variables in content - ensure all replacements work correctly
    let processedContent = data.content;
    
    // Define replacement pairs in order of specificity (longest patterns first)
    const replacements: [RegExp, string][] = [
      [/{nome_cliente}/g, data.recipientName],
      [/{valor_cobranca}/g, formattedValue],
      [/{data_vencimento}/g, formattedDate],
      [/{numero_parcela}\/\{total_parcelas}/g, installmentInfo], // Handle "X/Y" pattern if present
      [/{numero_parcela}/g, String(currentInstallment)],
      [/{total_parcelas}/g, String(totalInstallments)],
      [/{forma_pagamento}/g, paymentMethod]
    ];
    
    // Apply all replacements
    replacements.forEach(([pattern, replacement]) => {
      processedContent = processedContent.replace(pattern, replacement);
    });
    
    // Log the original and processed content for debugging
    console.log("🔄 Original content:", data.content);
    console.log("✅ Processed content:", processedContent);
    
    // Replace subject variables too
    let processedSubject = data.subject;
    const subjectReplacements: [RegExp, string][] = [
      [/{valor_cobranca}/g, formattedValue],
      [/{numero_parcela}\/\{total_parcelas}/g, installmentInfo],
      [/{numero_parcela}/g, String(currentInstallment)],
      [/{total_parcelas}/g, String(totalInstallments)]
    ];
    
    subjectReplacements.forEach(([pattern, replacement]) => {
      processedSubject = processedSubject.replace(pattern, replacement);
    });
    
    // Check if the template contains the string "parcela" but numbers weren't replaced
    if (processedContent.includes("parcela") && 
        (processedContent.includes("{numero_parcela}") || processedContent.includes("{total_parcelas}"))) {
      console.warn("⚠️ Warning: Template contains 'parcela' but variables weren't replaced. This may indicate a template issue.");
      
      // Emergency replacement to avoid "{parcela X/Y}" showing up in emails
      processedContent = processedContent
        .replace(/parcela {numero_parcela}\/\{total_parcelas}/g, `parcela ${installmentInfo}`)
        .replace(/parcela {numero_parcela}/g, `parcela ${currentInstallment}`);
    }
    
    // Convert line breaks to HTML paragraphs
    const paragraphs = processedContent.split('\n').filter(p => p.trim() !== '');
    const htmlParagraphs = paragraphs.map(p => `<p style="margin-bottom: 1em; line-height: 1.5;">${p}</p>`).join('\n');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${htmlParagraphs}
        </body>
      </html>
    `;

    console.log("📧 Processing email to:", recipients.join(", "));
    console.log("📋 Subject:", processedSubject);
    console.log("🔍 Current installment:", currentInstallment, "Total installments:", totalInstallments);
    
    try {
      const emailResponse = await resend.emails.send({
        from: "financeiro@flowcode.cc",
        to: recipients,
        subject: processedSubject,
        html: htmlContent,
      });

      // Add to cache to prevent duplicates
      emailCache.set(cacheKey, Date.now());
      
      console.log("✅ Email sent successfully:", JSON.stringify(emailResponse));

      return new Response(JSON.stringify({ 
        status: "success", 
        message: "Email sent successfully",
        details: emailResponse 
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
      
      return new Response(
        JSON.stringify({ 
          status: "error", 
          message: "Email sending error",
          details: {
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
    return new Response(
      JSON.stringify({ 
        status: "error", 
        message: error.message,
        details: error 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
