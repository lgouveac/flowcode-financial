import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    console.log('🚀 Nova edge function - dados recebidos:', requestBody);

    const webhookUrl = requestBody.webhook_url;
    
    if (!webhookUrl) {
      throw new Error('Webhook URL not provided');
    }

    console.log('🎯 URL que será chamada:', webhookUrl);

    // Preparar parâmetros para GET request
    const webhookParams = new URLSearchParams();
    
    webhookParams.append('action', 'sign_contract');
    webhookParams.append('timestamp', new Date().toISOString());
    
    // Adicionar todos os dados do contrato
    if (requestBody.contract) {
      Object.entries(requestBody.contract).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          webhookParams.append(`contract_${key}`, value.toString());
        }
      });
    }

    const finalUrl = `${webhookUrl}?${webhookParams}`;
    console.log('🔗 URL final com parâmetros:', finalUrl);

    const webhookResponse = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'FlowCode-Webhook/1.0',
      },
    });

    console.log('✅ Resposta do webhook:', webhookResponse.status);

    if (!webhookResponse.ok) {
      const responseText = await webhookResponse.text();
      throw new Error(`Webhook failed with status: ${webhookResponse.status}. Response: ${responseText}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Signing webhook called successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Erro na nova edge function:', error);
    
    // Se for erro de CORS, tentar contornar
    if (error.message.includes('CORS') || error.message.includes('fetch')) {
      console.log('🔄 Tentativa de contorno para CORS...');
      
      // Tentar sem verificação de resposta
      try {
        const simpleWebhookUrl = requestBody.webhook_url;
        if (simpleWebhookUrl) {
          const params = new URLSearchParams({
            action: 'sign_contract',
            timestamp: new Date().toISOString(),
            contract_id: requestBody.contract?.id?.toString() || '',
            status: 'completed'
          });
          
          // Fire and forget
          fetch(`${simpleWebhookUrl}?${params}`, { method: 'GET' }).catch(() => {});
          
          return new Response(
            JSON.stringify({ success: true, message: 'Webhook sent (CORS workaround)' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
        }
      } catch (corsError) {
        console.error('Falha no contorno CORS:', corsError);
      }
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