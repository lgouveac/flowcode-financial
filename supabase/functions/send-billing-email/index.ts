
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received email request");
    const data: EmailRequest = await req.json();
    console.log("Request data:", JSON.stringify(data));
    
    // Format currency
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(data.billingValue);
    
    // Format date
    const formattedDate = new Date(data.dueDate).toLocaleDateString('pt-BR');
    
    // Replace variables in content
    let processedContent = data.content
      .replace(/{nome_cliente}/g, data.recipientName)
      .replace(/{valor_cobranca}/g, formattedValue)
      .replace(/{data_vencimento}/g, formattedDate);
    
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

    console.log("Processing email to:", data.to);
    console.log("Subject:", data.subject);
    
    const emailResponse = await resend.emails.send({
      from: "financeiro@flowcode.cc",
      to: [data.to],
      subject: data.subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", JSON.stringify(emailResponse));

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
  } catch (error: any) {
    console.error("Error sending email:", error);
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
