import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      throw new Error(`Webhook failed with status: ${webhookResponse.status}. Response: ${responseText}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Contract webhook called successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error calling contract webhook:', error);
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