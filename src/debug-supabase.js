// Script para testar conexão Supabase e verificar dados
import { supabase } from './src/integrations/supabase/client.js';

async function testSupabase() {
  console.log('🔍 Testando conexão Supabase...');
  
  try {
    // Teste de autenticação
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Usuário:', user ? 'Logado' : 'Não logado');
    
    // Teste tabela cash_flow
    console.log('💰 Testando cash_flow...');
    const cashFlow = await supabase.from('cash_flow').select('*').limit(5);
    console.log('Cash flow:', {
      success: !cashFlow.error,
      count: cashFlow.data?.length,
      error: cashFlow.error?.message,
      data: cashFlow.data
    });
    
    // Teste tabela clients
    console.log('👥 Testando clients...');
    const clients = await supabase.from('clients').select('*').limit(5);
    console.log('Clients:', {
      success: !clients.error,
      count: clients.data?.length,
      error: clients.error?.message,
      data: clients.data
    });
    
    // Teste tabela payments
    console.log('💳 Testando payments...');
    const payments = await supabase.from('payments').select('*').limit(5);
    console.log('Payments:', {
      success: !payments.error,
      count: payments.data?.length,
      error: payments.error?.message,
      data: payments.data
    });
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

testSupabase();