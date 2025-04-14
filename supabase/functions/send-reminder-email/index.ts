import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://itlpvpdwgiwbdpqheemw.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailData {
  recipientName?: string;
  responsibleName?: string;
  billingValue?: number;
  dueDate?: string;
  daysOverdue?: number;
  descricaoServico?: string;
  paymentMethod?: string;
}

const processEmailContent = (content: string, data: EmailData): string => {
  let processedContent = content;
  
  // Create a mapping of template variables to their values
  const variableMap: Record<string, string> = {
    '{nome_cliente}': data.recipientName || 'Cliente',
    '{nome_responsavel}': data.responsibleName || 'Responsável',
    '{nomeresponsavel}': data.responsibleName || 'Responsável',
    '{responsavel}': data.responsibleName || 'Responsável',
    '{responsável}': data.responsibleName || 'Responsável',
    '{valor_cobranca}': formatCurrency(data.billingValue || 0),
    '{data_vencimento}': formatDate(data.dueDate),
    '{dias_atraso}': String(data.daysOverdue || 0),
    '{descricao_servico}': data.descricaoServico || '',
    '{forma_pagamento}': data.paymentMethod || 'PIX',
  };
  
  // Replace all variables in the content
  for (const [variable, value] of Object.entries(variableMap)) {
    const regex = new RegExp(variable, 'gi'); // Case insensitive
    processedContent = processedContent.replace(regex, value);
  }
  
  return processedContent;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    console.error("Error formatting date:", e);
    return '';
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📨 Received payment reminder email request");
    const data = await req.json();
    console.log("📝 Email request data:", JSON.stringify(data));
    
    // This can be a single client ID, or null for all unpaid clients
    const clientId = data.clientId;
    const forceTemplate = data.templateId; // Optional specific template to use
    
    // Get the default reminder template
    const { data: defaultTemplate, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("type", "clients")
      .eq("subtype", "reminder")
      .eq("is_default", true)
      .single();
    
    if (templateError) {
      console.error("Error fetching template:", templateError);
      throw new Error("No reminder template found");
    }
    
    const templateId = forceTemplate || defaultTemplate.id;
    const { data: template, error: specificTemplateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("id", templateId)
      .single();
    
    if (specificTemplateError) {
      console.error("Error fetching specific template:", specificTemplateError);
      throw new Error("Template not found");
    }
    
    // Query for unpaid clients and their payments
    let clientsQuery = supabase
      .from("clients")
      .select(`
        id, 
        name, 
        email, 
        responsible_name,
        partner_name,
        payment_method,
        payments(id, amount, due_date, description, status)
      `)
      .eq("status", "unpaid");
    
    // If a specific client ID was provided, filter by it
    if (clientId) {
      clientsQuery = clientsQuery.eq("id", clientId);
    }
    
    const { data: clients, error: clientsError } = await clientsQuery;
    
    if (clientsError) {
      console.error("Error fetching clients:", clientsError);
      throw new Error("Error fetching unpaid clients");
    }
    
    if (!clients || clients.length === 0) {
      return new Response(JSON.stringify({ message: "No unpaid clients found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    console.log(`Found ${clients.length} unpaid clients`);
    
    // Keep track of successful and failed emails
    const results = {
      success: 0,
      failed: 0,
      details: [] as { client: string, status: string, message?: string }[]
    };
    
    for (const client of clients) {
      // Find overdue payments
      const overduePayments = client.payments.filter(
        (p: any) => p.status === 'pending' && new Date(p.due_date) < new Date()
      );
      
      if (overduePayments.length === 0) {
        console.log(`Client ${client.name} has no overdue payments`);
        results.details.push({
          client: client.name,
          status: "skipped",
          message: "No overdue payments"
        });
        continue;
      }
      
      // Get the oldest overdue payment
      const oldestOverdue = overduePayments.reduce((oldest: any, current: any) => {
        return new Date(oldest.due_date) < new Date(current.due_date) ? oldest : current;
      }, overduePayments[0]);
      
      // Calculate days overdue
      const dueDate = new Date(oldestOverdue.due_date);
      const today = new Date();
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get payment method as string
      let paymentMethodStr = 'PIX';
      if (client.payment_method === 'boleto') paymentMethodStr = 'Boleto';
      if (client.payment_method === 'credit_card') paymentMethodStr = 'Cartão de Crédito';
      
      // Determine responsible name - ADDED DEBUG LOGGING
      console.log("Client responsible_name for reminder:", client.responsible_name);
      console.log("Client partner_name for reminder:", client.partner_name);
      
      const responsibleName = client.responsible_name || client.partner_name || "Responsável";
      console.log("Using responsible name for reminder:", responsibleName);
      
      // Prepare email data
      const emailData: EmailData = {
        recipientName: client.name,
        responsibleName: responsibleName,
        billingValue: oldestOverdue.amount,
        dueDate: oldestOverdue.due_date,
        daysOverdue: daysOverdue,
        descricaoServico: oldestOverdue.description,
        paymentMethod: paymentMethodStr
      };
      
      // Process the email content with the data
      const subject = processEmailContent(template.subject, emailData);
      const content = processEmailContent(template.content, emailData);
      
      // Convert line breaks to HTML paragraphs
      const htmlContent = content
        .split('\n')
        .filter(line => line.trim() !== '')
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

      try {
        console.log(`Sending reminder email to ${client.email}`);
        
        const emailResponse = await resend.emails.send({
          from: "Financeiro FlowCode <financeiro@flowcode.cc>",
          to: [client.email],
          subject: subject,
          html: wrappedHtml,
        });

        console.log(`Email sent to ${client.name}: ${JSON.stringify(emailResponse)}`);
        
        // Log the email in the database
        const { error: logError } = await supabase
          .from("payment_reminder_log")
          .insert({
            client_id: client.id,
            payment_id: oldestOverdue.id,
            subject: subject,
            days_overdue: daysOverdue,
            sent_at: new Date().toISOString()
          });
        
        if (logError) {
          console.error(`Error logging email: ${logError.message}`);
        }
        
        results.success++;
        results.details.push({
          client: client.name,
          status: "success"
        });
      } catch (error: any) {
        console.error(`Error sending email to ${client.name}: ${error.message}`);
        results.failed++;
        results.details.push({
          client: client.name,
          status: "failed",
          message: error.message
        });
      }
    }
    
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ Error in payment reminder function:", error);
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
