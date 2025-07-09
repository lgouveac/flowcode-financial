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
      throw new Error(`Webhook failed with status: ${webhookResponse.status}. Response: ${responseText}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook called successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error calling webhook:', error);
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