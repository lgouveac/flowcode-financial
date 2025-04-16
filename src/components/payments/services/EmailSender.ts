
import { supabase } from "@/integrations/supabase/client";
import { Payment } from "@/types/payment";

export const sendPaymentEmail = async (payment: Payment) => {
  // Check if payment has an associated template
  let templateId = payment.email_template;
  
  // If no template is selected, fetch the default oneTime template
  if (!templateId) {
    const { data: defaultTemplate, error: templateError } = await supabase
      .from('email_templates')
      .select('id')
      .eq('type', 'clients')
      .eq('subtype', 'oneTime')
      .eq('is_default', true)
      .single();
      
    if (templateError || !defaultTemplate) {
      // Try to get the recurring template as fallback
      const { data: recurringTemplate, error: recurringError } = await supabase
        .from('email_templates')
        .select('id')
        .eq('type', 'clients')
        .eq('subtype', 'recurring')
        .eq('is_default', true)
        .single();
        
      if (recurringError || !recurringTemplate) {
        throw new Error('Nenhum template padrão encontrado. Por favor, crie um template para cobranças pontuais ou recorrentes.');
      }
      
      templateId = recurringTemplate.id;
    } else {
      templateId = defaultTemplate.id;
    }
  }
  
  // Get payment method as string
  let paymentMethodStr = 'PIX';
  if (payment.payment_method === 'boleto') paymentMethodStr = 'Boleto';
  if (payment.payment_method === 'credit_card') paymentMethodStr = 'Cartão de Crédito';
  
  // Get days until due
  const dueDate = new Date(payment.due_date);
  const today = new Date();
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Get client data
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('name, email, responsible_name, partner_name')
    .eq('id', payment.client_id)
    .single();
    
  if (clientError) {
    throw new Error(`Erro ao obter dados do cliente: ${clientError.message}`);
  }
  
  // Determine responsible name - use responsible_name with an explicit fallback to partner_name
  console.log("Client responsible_name for payment email:", clientData.responsible_name);
  console.log("Client partner_name for payment email:", clientData.partner_name);
  
  // Explicitly check for null or undefined
  const responsibleName = (clientData.responsible_name !== null && clientData.responsible_name !== undefined && clientData.responsible_name !== '') 
    ? clientData.responsible_name 
    : (clientData.partner_name || "Responsável");
  
  console.log("Using responsible name for payment email:", responsibleName);
  
  // Prepare installment information
  const currentInstallment = payment.installment_number || 1;
  const totalInstallments = payment.total_installments || 1;
  
  // Format amount to BRL currency
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(payment.amount);
  
  // Format due date
  const formattedDueDate = dueDate.toLocaleDateString('pt-BR');
  
  console.log('Sending email with data:', {
    to: clientData.email,
    templateId,
    clientName: clientData.name, 
    responsibleName,
    amount: formattedAmount, // Now properly formatted
    dueDate: formattedDueDate, // Now properly formatted
    description: payment.description,
    currentInstallment,
    totalInstallments,
    paymentMethod: paymentMethodStr
  });
  
  // Send email via the edge function
  const { error: emailError } = await supabase.functions.invoke(
    'send-billing-email',
    {
      body: JSON.stringify({
        to: clientData.email,
        templateId: templateId,
        data: {
          recipientName: clientData.name,
          responsibleName: responsibleName,
          billingValue: formattedAmount, // Using formatted value
          dueDate: formattedDueDate, // Using formatted date
          daysUntilDue: daysUntilDue,
          descricaoServico: payment.description,
          paymentMethod: paymentMethodStr,
          currentInstallment: currentInstallment,
          totalInstallments: totalInstallments,
          
          // Add template variables in Portuguese format for backward compatibility
          nome_cliente: clientData.name,
          nome_responsavel: responsibleName,
          valor_cobranca: formattedAmount,
          data_vencimento: formattedDueDate,
          descricao_servico: payment.description,
          forma_pagamento: paymentMethodStr,
          numero_parcela: currentInstallment,
          total_parcelas: totalInstallments
        }
      })
    }
  );
  
  if (emailError) {
    console.error('Email error:', emailError);
    throw new Error(`Erro ao enviar email: ${emailError.message}`);
  }
  
  // Log the notification
  const { error: logError } = await supabase
    .from('email_notification_log')
    .insert({
      payment_id: payment.id,
      client_id: payment.client_id,
      days_before: daysUntilDue > 0 ? daysUntilDue : 0,
      due_date: payment.due_date,
      payment_type: 'oneTime',
      billing_id: payment.id,
      sent_at: new Date().toISOString()
    });
    
  if (logError) {
    console.error("Erro ao registrar notificação:", logError);
    throw new Error(`Erro ao registrar notificação: ${logError.message}`);
  }

  return clientData;
};
