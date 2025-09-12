// Teste direto do Supabase - execute no console do navegador
console.log('🔍 TESTE DIRETO SUPABASE - Cole no console do navegador');

// 1. Verificar usuário atual
const testUser = async () => {
  const { data: { user }, error } = await window.supabase.auth.getUser();
  console.log('👤 Usuário atual:', {
    loggedIn: !!user,
    id: user?.id,
    email: user?.email,
    error: error?.message
  });
  return user;
};

// 2. Testar acesso direto às tabelas
const testTables = async () => {
  console.log('🧪 Testando tabelas...');
  
  // Cash Flow
  const cashFlow = await window.supabase.from('cash_flow').select('*').limit(3);
  console.log('💰 Cash Flow:', {
    success: !cashFlow.error,
    count: cashFlow.data?.length || 0,
    error: cashFlow.error?.message,
    firstRow: cashFlow.data?.[0]
  });
  
  // Clients  
  const clients = await window.supabase.from('clients').select('*').limit(3);
  console.log('👥 Clients:', {
    success: !clients.error,
    count: clients.data?.length || 0,
    error: clients.error?.message,
    firstRow: clients.data?.[0]
  });
  
  // Payments
  const payments = await window.supabase.from('payments').select('*').limit(3);
  console.log('💳 Payments:', {
    success: !payments.error,
    count: payments.data?.length || 0,
    error: payments.error?.message,
    firstRow: payments.data?.[0]
  });
};

// 3. Executar testes
const runTests = async () => {
  console.log('🚀 Iniciando testes Supabase...');
  await testUser();
  await testTables();
  console.log('✅ Testes concluídos');
};

// Auto-executar se window.supabase existir
if (typeof window !== 'undefined' && window.supabase) {
  runTests();
} else {
  console.log('❌ window.supabase não encontrado. Execute no console do navegador.');
}