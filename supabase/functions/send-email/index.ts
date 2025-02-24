
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  console.log("Handler started");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Parsing request body");
    const requestBody = await req.json();
    console.log("Request body:", requestBody);

    const { type, subtype, templateId, to, data } = requestBody;
    
    if (!type || !subtype || !templateId || !to || !data) {
      console.error("Missing required fields:", { type, subtype, templateId, to, data });
      throw new Error("Missing required fields in request");
    }

    console.log("Fetching template from database");
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) {
      console.error("Database error:", templateError);
      throw new Error(`Error fetching template: ${templateError.message}`);
    }

    if (!template) {
      console.error("Template not found for ID:", templateId);
      throw new Error("Template not found");
    }

    console.log("Found template:", template);

    // Replace variables in subject and content
    let subject = template.subject;
    let content = template.content;

    console.log("Replacing variables with:", data);
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, "g");
      subject = subject.replace(regex, String(value));
      content = content.replace(regex, String(value));
    });

    console.log("Preparing to send email", {
      to,
      subject,
      contentLength: content.length
    });

    // Check if RESEND_API_KEY is set
    if (!Deno.env.get("RESEND_API_KEY")) {
      throw new Error("RESEND_API_KEY is not set");
    }

    // Send the email using Resend
    const emailResponse = await resend.emails.send({
      from: "Lovable <onboarding@resend.dev>",
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
    console.error("Error in send-email function:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
        name: error.name
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
