
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
    
    let to, cc, subject, content, variables;
    
    // Check if we're using direct content or template ID
    if (data.templateId) {
      console.log(`🔍 Using template ID: ${data.templateId}`);
      
      // Get template from database using supabase
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://itlpvpdwgiwbdpqheemw.supabase.co";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (!supabaseKey) {
        throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
      }
      
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.43.2");
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Fetch the template
      const { data: template, error: templateError } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", data.templateId)
        .single();
      
      if (templateError) {
        console.error("❌ Error fetching template:", templateError);
        throw new Error(`Failed to fetch template: ${templateError.message}`);
      }
      
      if (!template) {
        throw new Error(`Template with ID ${data.templateId} not found`);
      }
      
      console.log(`📄 Found template: ${template.name}`);
      
      to = data.to;
      cc = data.cc || [];
      subject = template.subject;
      content = template.content;
      variables = data.data || {};
    } else {
      // Legacy direct content method
      to = data.to;
      cc = data.cc || [];
      subject = data.subject;
      content = data.content;
      variables = data;
    }
    
    if (!to || typeof to !== 'string') {
      throw new Error("Recipient email (to) is required and must be a string");
    }
    
    if (!subject || typeof subject !== 'string') {
      throw new Error("Email subject is required and must be a string");
    }
    
    if (!content || typeof content !== 'string') {
      throw new Error("Email content is required and must be a string");
    }
    
    // Ensure cc is an array
    if (cc && !Array.isArray(cc)) {
      cc = [cc];
    }
    
    console.log(`📧 Preparing email to: ${to}`);
    if (cc && cc.length > 0) {
      console.log(`📧 CC: ${cc.join(', ')}`);
    }
    console.log(`📑 Subject: ${subject}`);
    console.log(`🔄 Variables:`, variables);
    
    // Replace variables in subject and content
    let processedSubject = subject;
    let processedContent = content;
    
    Object.entries(variables).forEach(([key, value]) => {
      // Format monetary values with R$ if they appear to be numbers and are monetary fields
      const isMonetary = ['valor_cobranca', 'valor_nota', 'valor_mensal'].includes(key);
      const formattedValue = 
        isMonetary && typeof value === 'number' 
          ? `R$ ${Number(value).toFixed(2).replace('.', ',')}`
          : String(value);
      
      // Replace in subject
      const subjectRegex = new RegExp(`{${key}}`, 'g');
      processedSubject = processedSubject.replace(subjectRegex, formattedValue);
      
      // Replace in content
      const contentRegex = new RegExp(`{${key}}`, 'g');
      processedContent = processedContent.replace(contentRegex, formattedValue);
    });

    // Convert line breaks to HTML paragraphs
    const htmlContent = processedContent
      .split('\n')
      .filter(line => line.trim() !== '') // Remove empty lines
      .map(line => `<p style="margin-bottom: 1em; line-height: 1.5; text-align: left;">${line}</p>`)
      .join('\n');

    const wrappedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0; padding: 20px; text-align: left;">
          ${htmlContent}
        </body>
      </html>
    `;

    const emailRequest: any = {
      from: "Financeiro FlowCode <financeiro@flowcode.cc>",
      to: [to],
      subject: processedSubject,
      html: wrappedHtml,
    };
    
    // Add CC if provided
    if (cc && cc.length > 0) {
      emailRequest.cc = cc;
    }

    const emailResponse = await resend.emails.send(emailRequest);

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
