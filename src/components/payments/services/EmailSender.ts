
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
  
  // Determine responsible name
  const responsibleName = clientData.responsible_name || clientData.partner_name || "Responsável";
  
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
          billingValue: payment.amount,
          dueDate: payment.due_date,
          daysUntilDue: daysUntilDue,
          descricaoServico: payment.description,
          paymentMethod: paymentMethodStr
        }
      })
    }
  );
  
  if (emailError) {
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
