
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
    const {
      to,
      subject,
      content,
      nome_cliente,
      valor_cobranca,
      data_vencimento,
      plano_servico,
      descricao_servico,
      numero_parcela,
      total_parcelas,
      forma_pagamento,
      nome_funcionario,
      valor_nota,
      mes_referencia,
      total_horas
    } = await req.json();

    // Format date
    const formattedDate = data_vencimento ? new Date(data_vencimento).toLocaleDateString('pt-BR') : '';
    
    // Format payment method
    const getFormattedPaymentMethod = (method: string) => {
      switch (method?.toLowerCase()) {
        case 'pix': return 'PIX';
        case 'boleto': return 'Boleto';
        case 'credit_card': return 'Cartão de Crédito';
        default: return method || '';
      }
    };

    // Format currency
    const formatCurrency = (value: number) => {
      return value ? value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }) : '';
    };

    // Replace variables in content
    let processedContent = content
      .replace(/{nome_cliente}/g, nome_cliente || '')
      .replace(/{valor_cobranca}/g, formatCurrency(valor_cobranca))
      .replace(/{data_vencimento}/g, formattedDate)
      .replace(/{plano_servico}/g, plano_servico || '')
      .replace(/{descricao_servico}/g, descricao_servico || '')
      .replace(/{numero_parcela}/g, numero_parcela?.toString() || '')
      .replace(/{total_parcelas}/g, total_parcelas?.toString() || '')
      .replace(/{forma_pagamento}/g, getFormattedPaymentMethod(forma_pagamento))
      .replace(/{nome_funcionario}/g, nome_funcionario || '')
      .replace(/{valor_nota}/g, formatCurrency(valor_nota))
      .replace(/{mes_referencia}/g, mes_referencia || '')
      .replace(/{total_horas}/g, total_horas?.toString() || '');

    console.log("Sending email with processed content:", {
      to,
      subject,
      processedContent,
      originalVariables: {
        nome_cliente,
        valor_cobranca,
        data_vencimento,
        plano_servico,
        numero_parcela,
        total_parcelas,
        forma_pagamento
      }
    });

    const emailResponse = await resend.emails.send({
      from: "Finance App <financeiro@flowcode.cc>",
      to: [to],
      subject: subject,
      html: processedContent,
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
    console.error("Error in send-email function:", error);
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
