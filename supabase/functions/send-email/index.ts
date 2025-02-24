
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
    const { type, subtype, templateId, to, data } = await req.json();

    // Log the received data
    console.log("Received request:", { type, subtype, templateId, to, data });

    // Fetch the template from the database
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env;
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/email_templates?id=eq.${templateId}`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const [template] = await response.json();
    if (!template) {
      throw new Error("Template not found");
    }

    // Replace variables in subject and content
    let subject = template.subject;
    let content = template.content;

    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, "g");
      subject = subject.replace(regex, String(value));
      content = content.replace(regex, String(value));
    });

    // Send the email using Resend
    const emailResponse = await resend.emails.send({
      from: "test@resend.dev",
      to: [to],
      subject: subject,
      html: content,
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
    console.error("Error in send-email function:", error);
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

