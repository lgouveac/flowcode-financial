
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { EmailData, processEmailContent, processEmailSubject, convertToHtml } from "./email-formatter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessBillingRequest {
  to: string;
  subject: string;
  content: string;
  recipientName: string;
  billingValue: number;
  dueDate: string;
  daysUntilDue?: number;
  currentInstallment: number;
  totalInstallments: number;
  paymentMethod?: string;
  description?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ProcessBillingRequest = await req.json();
    
    // Prepare email data
    const emailData: EmailData = {
      recipientName: data.recipientName,
      billingValue: data.billingValue,
      dueDate: data.dueDate,
      currentInstallment: data.currentInstallment,
      totalInstallments: data.totalInstallments,
      paymentMethod: data.paymentMethod,
      description: data.description
    };

    // Process subject and content
    const processedSubject = processEmailSubject(data.subject, emailData);
    const processedContent = processEmailContent(data.content, emailData);
    
    // Convert to HTML
    const htmlContent = convertToHtml(processedContent);

    // Call the send-email function
    const sendEmailUrl = "https://itlpvpdwgiwbdpqheemw.supabase.co/functions/v1/send-email";
    
    const emailResponse = await fetch(sendEmailUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": req.headers.get("Authorization") || ""
      },
      body: JSON.stringify({
        to: data.to,
        subject: processedSubject,
        content: htmlContent
      })
    });

    const emailResult = await emailResponse.json();
    console.log("Email sending result:", emailResult);

    return new Response(JSON.stringify(emailResult), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error processing billing notification:", error);
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
