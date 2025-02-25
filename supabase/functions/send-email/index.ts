
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'clients' | 'employees';
  subtype: 'recurring' | 'oneTime' | 'invoice' | 'hours';
  templateId: string;
  to: string;
  data: Record<string, string | number>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, subtype, templateId, to, data }: EmailRequest = await req.json();
    console.log("Received email request:", { type, subtype, templateId, to, data });

    const { error: templateError, data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    // Se é um email para funcionário, verifica se hoje é o dia configurado
    if (type === 'employees' && template.send_day) {
      const today = new Date();
      const dayOfMonth = today.getDate();
      
      console.log("Checking send day:", { configuredDay: template.send_day, currentDay: dayOfMonth });
      
      if (dayOfMonth !== template.send_day) {
        return new Response(
          JSON.stringify({ 
            error: "Este email está configurado para ser enviado apenas no dia " + template.send_day 
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Replace variables in subject and content
    let subject = template.subject;
    let content = template.content;

    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      subject = subject.replace(regex, String(value));
      content = content.replace(regex, String(value));
    });

    const emailResponse = await resend.emails.send({
      from: "Sistema <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: content,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
