
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    console.log("📨 Received email request");
    const data = await req.json();
    console.log("📝 Email request data:", JSON.stringify(data));
    
    const { to, subject, content, ...variables } = data;
    
    if (!to || typeof to !== 'string') {
      throw new Error("Recipient email (to) is required and must be a string");
    }
    
    if (!subject || typeof subject !== 'string') {
      throw new Error("Email subject is required and must be a string");
    }
    
    if (!content || typeof content !== 'string') {
      throw new Error("Email content is required and must be a string");
    }
    
    console.log(`📧 Preparing email to: ${to}`);
    console.log(`📑 Subject: ${subject}`);
    console.log(`🔄 Variables:`, variables);
    
    // Replace variables in content
    let processedContent = content;
    Object.entries(variables).forEach(([key, value]) => {
      // Format monetary values with R$ if they appear to be numbers
      const formattedValue = 
        ['valor_cobranca', 'valor_nota'].includes(key) && typeof value === 'number' 
          ? `R$ ${Number(value).toFixed(2).replace('.', ',')}`
          : String(value);
      
      const regex = new RegExp(`{${key}}`, 'g');
      processedContent = processedContent.replace(regex, formattedValue);
    });

    // Convert line breaks to HTML paragraphs
    const htmlContent = processedContent
      .split('\n')
      .filter(line => line.trim() !== '') // Remove empty lines
      .map(line => `<p style="margin-bottom: 1em; line-height: 1.5;">${line}</p>`)
      .join('\n');

    const wrappedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${htmlContent}
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "financeiro@flowcode.cc",
      to: [to],
      subject: subject,
      html: wrappedHtml,
    });

    console.log("✅ Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
