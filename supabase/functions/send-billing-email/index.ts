
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BillingEmailRequest {
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
    const { to, subject, content, recipientName, billingValue, dueDate, daysUntilDue }: BillingEmailRequest = await req.json();

    // Replace variables in the content
    let processedContent = content
      .replace(/{client_name}/g, recipientName)
      .replace(/{billing_value}/g, billingValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
      .replace(/{due_date}/g, new Date(dueDate).toLocaleDateString('pt-BR'))
      .replace(/{days_until_due}/g, daysUntilDue.toString());

    // Add default styles and wrapping
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body {
              font-family: sans-serif;
              line-height: 1.5;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          ${processedContent}
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Finance App <financeiro@flowcode.cc>",
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-billing-email function:", error);
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
