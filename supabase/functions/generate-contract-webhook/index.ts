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
      criacao_contrato: JSON.stringify({
        contractId: contractData?.id || 'unknown',
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
    console.log('Received request:', requestBody);

    // Call the n8n webhook with GET method and query parameters
    const webhookUrl = "https://n8n.sof.to/webhook-test/e39a39a2-b53d-4cda-b3cb-c526da442158";
    const params = new URLSearchParams({
      data: JSON.stringify(requestBody)
    });
    const fullUrl = `${webhookUrl}?${params.toString()}`;
    
    console.log('Calling webhook:', fullUrl);
    console.log('Payload being sent:', JSON.stringify(requestBody, null, 2));

    const webhookResponse = await fetch(fullUrl, {
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
      await saveToWebhooksTable(webhookUrl, requestBody, false, `Webhook failed with status: ${webhookResponse.status}`);
      throw new Error(`Webhook failed with status: ${webhookResponse.status}. Response: ${responseText}`);
    }

    await saveToWebhooksTable(webhookUrl, requestBody, true);

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook called successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error calling webhook:', error);

    try {
      const webhookUrl = "https://n8n.sof.to/webhook-test/e39a39a2-b53d-4cda-b3cb-c526da442158";
      await saveToWebhooksTable(webhookUrl, requestBody, false, error.message);
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