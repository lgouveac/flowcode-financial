
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";
import { 
  corsHeaders, 
  prepareTemplateData, 
  logMessage, 
  logError,
  fetchCCRecipients 
} from "./utils.ts";
import { 
  fetchEmailTemplate
} from "./email-service.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body safely
    let requestBody = {};
    let bypass = false;
    let test = false;
    
    try {
      if (req.body) {
        // Make sure the body can be parsed as JSON
        const bodyText = await req.text();
        if (bodyText && bodyText.trim() !== "") {
          requestBody = JSON.parse(bodyText);
          bypass = !!requestBody.bypass;
          test = !!requestBody.test;
        }
      }
    } catch (parseError) {
      // If parsing fails, just log and continue with empty object
      console.error("Error parsing request body:", parseError);
      requestBody = {};
    }
    
    logMessage(`Employee notification trigger function called ${test ? "in TEST MODE" : ""} with BYPASS=${bypass}`, "🔔");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://itlpvpdwgiwbdpqheemw.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseKey) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all employees regardless of status - no filtering
    const { data: allEmployees, error: employeeError } = await supabase
      .from("employees")
      .select("id, name, email, position");
    
    if (employeeError) {
      throw new Error("Failed to fetch employees: " + employeeError.message);
    }
    
    if (!allEmployees || allEmployees.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No employees found in the database", 
          totalSent: 0
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    logMessage(`Found ${allEmployees.length} employees`, "👥");
    
    // Get a template for sending emails - any template will do
    const emailTemplate = await fetchEmailTemplate(supabase);
    
    // Send emails to all employees
    const sentEmails = [];
    const emailErrors = [];
    
    for (const employee of allEmployees) {
      try {
        logMessage(`Processing employee: ${employee.name}`, "📧");
        
        // Get CC recipients
        const ccRecipients = await fetchCCRecipients(supabase);
        
        // Prepare dummy data for the template
        const templateData = {
          nome_funcionario: employee.name || "Funcionário",
          email_funcionario: employee.email || "email@exemplo.com",
          valor_nota: 0,
          data_nota: new Date().toISOString().split('T')[0],
          mes_referencia: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          posicao: employee.position || "Colaborador",
          observacoes: "Teste de notificação"
        };
        
        // Send email directly
        const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
          'send-email',
          {
            body: {
              to: employee.email,
              cc: ccRecipients,
              templateId: emailTemplate.id,
              type: "employees",
              subtype: emailTemplate.subtype || "invoice",
              data: templateData
            }
          }
        );

        if (emailError) {
          throw new Error(`Error sending email: ${emailError.message}`);
        }

        sentEmails.push({ employee: employee.name, email: employee.email });
        logMessage(`Successfully sent email to ${employee.name} (${employee.email})`, "✅");
      } catch (error: any) {
        logError(`Error processing employee ${employee.name}`, error);
        emailErrors.push({ employee: employee.name, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Emails enviados para ${sentEmails.length} funcionários (${emailErrors.length} erros)`, 
        sentEmails, 
        errors: emailErrors,
        totalSent: sentEmails.length,
        totalErrors: emailErrors.length,
        totalEmployees: allEmployees?.length || 0
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    logError("Error in employee notification process", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
