import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = 'https://itlpvpdwgiwbdpqheemw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bHB2cGR3Z2l3YmRwcWhlZW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxOTA5NzEsImV4cCI6MjA1NTc2Njk3MX0.gljQ6JAfbMzP-cbA68Iz21vua9YqAqVQgpB-eLk6nAg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function saveToWebhooksTable(webhookUrl: string, contractData: any, success: boolean, errorMsg?: string) {
  try {
    const data = {
      assinatura_contrato: JSON.stringify({
        contractId: contractData?.contract?.id || 'unknown',
        timestamp: new Date().toISOString(),
        webhookUrl: webhookUrl,
        success: success,
        error: errorMsg || null,
        contractData: contractData
      })
    };

    await supabase.from('webhooks').insert([data]);
    console.log('✅ Salvo na tabela webhooks');
  } catch (err) {
    console.error('❌ Erro ao salvar:', err);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    const requestBody = await req.json();
    console.log('🔥 RECEBIDO:', JSON.stringify(requestBody, null, 2));

    // Use webhook URL from request - NO FALLBACK
    const webhookUrl = requestBody.webhook_url;
    
    console.log('🎯 WEBHOOK URL EXTRAÍDA:', webhookUrl);
    
    if (!webhookUrl) {
      console.error('❌ WEBHOOK URL NÃO FORNECIDA');
      throw new Error('Webhook URL not provided in request body');
    }
    
    // Remove webhook_url from data to send (não enviar campo interno)
    const { webhook_url, ...dataToSend } = requestBody;
    
    console.log('Calling contract webhook:', webhookUrl);
    console.log('Contract data being sent:', JSON.stringify(dataToSend, null, 2));

    // Preparar parâmetros para GET request - TODOS os dados
    const contract = dataToSend.contract;
    const payments = dataToSend.payments;
    const webhookParams = new URLSearchParams();
    
    // Campos básicos obrigatórios
    webhookParams.append('action', 'sign_contract');
    webhookParams.append('timestamp', new Date().toISOString());
    
    // Todos os campos do contrato
    if (contract) {
      Object.entries(contract).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'clients' && typeof value === 'object') {
            // Expandir dados do cliente
            webhookParams.append('client_name', value.name || '');
            webhookParams.append('client_email', value.email || '');
            webhookParams.append('client_type', value.type || '');
          } else {
            webhookParams.append(`contract_${key}`, value.toString());
          }
        }
      });
    }
    
    // Adicionar dados de pagamento se existirem
    if (payments && Array.isArray(payments)) {
      webhookParams.append('payments_count', payments.length.toString());
      payments.forEach((payment, index) => {
        Object.entries(payment).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            webhookParams.append(`payment_${index}_${key}`, value.toString());
          }
        });
      });
    }

    const webhookResponse = await fetch(`${webhookUrl}?${webhookParams}`, {
      method: 'GET',
    });

    console.log('Webhook response status:', webhookResponse.status);
    console.log('Webhook response headers:', Object.fromEntries(webhookResponse.headers.entries()));

    let responseText = '';
    try {
      responseText = await webhookResponse.text();
      console.log('Webhook response body:', responseText);
    } catch (e) {
      console.log('Could not read response body:', e);
    }

    if (!webhookResponse.ok) {
      await saveToWebhooksTable(webhookUrl, dataToSend, false, `Webhook failed with status: ${webhookResponse.status}`);
      throw new Error(`Webhook failed with status: ${webhookResponse.status}. Response: ${responseText}`);
    }

    await saveToWebhooksTable(webhookUrl, dataToSend, true);

    return new Response(
      JSON.stringify({ success: true, message: 'Contract webhook called successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error calling contract webhook:', error);

    try {
      const webhookUrl = requestBody.webhook_url;
      if (webhookUrl) {
        await saveToWebhooksTable(webhookUrl, requestBody, false, error.message);
      }
    } catch (logError) {
      console.error('Error saving to webhooks table:', logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});