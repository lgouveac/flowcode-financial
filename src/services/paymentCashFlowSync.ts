import { supabase } from "@/integrations/supabase/client";

export interface SyncPaymentResult {
  success: boolean;
  message: string;
  error?: any;
}

/**
 * Sincroniza um pagamento específico com o fluxo de caixa
 * Cria uma entrada no cash flow se o pagamento foi marcado como 'paid'
 * e ainda não possui uma entrada correspondente
 */
export const syncPaymentToCashFlow = async (
  paymentId: string,
  oldStatus: string,
  newStatus: string,
  paymentData: {
    description: string;
    amount: number;
    payment_date: string | null;
  }
): Promise<SyncPaymentResult> => {
  console.log('Syncing payment to cash flow:', {
    paymentId,
    oldStatus,
    newStatus,
    paymentData
  });

  // Só sincroniza se o pagamento foi alterado para 'paid'
  if (newStatus !== 'paid' || oldStatus === 'paid') {
    console.log('No sync needed - payment not newly marked as paid');
    return {
      success: true,
      message: 'No sync needed'
    };
  }

  // Validar se há data de pagamento
  if (!paymentData.payment_date) {
    return {
      success: false,
      message: 'Payment date is required for paid payments'
    };
  }

  try {
    // Verificar se já existe entrada no cash flow para este pagamento
    const { data: existingEntry, error: checkError } = await supabase
      .from('cash_flow')
      .select('id')
      .eq('payment_id', paymentId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing cash flow entry:', checkError);
      return {
        success: false,
        message: 'Error checking existing cash flow entry',
        error: checkError
      };
    }

    if (existingEntry) {
      console.log('Cash flow entry already exists for this payment');
      return {
        success: true,
        message: 'Cash flow entry already exists'
      };
    }

    // Criar nova entrada no cash flow
    const { error: insertError } = await supabase
      .from('cash_flow')
      .insert({
        type: 'income',
        description: paymentData.description,
        amount: paymentData.amount,
        date: paymentData.payment_date,
        category: 'payment',
        payment_id: paymentId,
        status: 'pending'
      });

    if (insertError) {
      console.error('Error creating cash flow entry:', insertError);
      return {
        success: false,
        message: 'Error creating cash flow entry',
        error: insertError
      };
    }

    console.log('Successfully created cash flow entry for payment:', paymentId);
    return {
      success: true,
      message: 'Cash flow entry created successfully'
    };

  } catch (error) {
    console.error('Exception in syncPaymentToCashFlow:', error);
    return {
      success: false,
      message: 'Unexpected error during sync',
      error
    };
  }
};