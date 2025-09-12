import { supabase } from '@/integrations/supabase/client';

interface AIServiceOptions {
  userMessage: string;
  context?: 'dashboard' | 'payments' | 'clients' | 'expenses' | 'general';
}

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeClients: number;
  recentPayments: any[];
  topClients: any[];
  historicalData: any[];
}

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private customSystemPrompt: string | null = null;
  private cachedFinancialData: FinancialData | null = null;
  private lastDataFetch: Date | null = null;
  private readonly DATA_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Carregar system prompt personalizado do localStorage
    this.customSystemPrompt = localStorage.getItem('ai-system-prompt');
  }

  setCustomSystemPrompt(prompt: string) {
    this.customSystemPrompt = prompt;
    localStorage.setItem('ai-system-prompt', prompt);
  }

  // Força atualização dos dados
  refreshData() {
    this.cachedFinancialData = null;
    this.lastDataFetch = null;
  }

  // Verifica se os dados em cache ainda são válidos
  private isDataCacheValid(): boolean {
    return this.cachedFinancialData !== null && 
           this.lastDataFetch !== null && 
           (Date.now() - this.lastDataFetch.getTime()) < this.DATA_CACHE_DURATION;
  }


  private async getFinancialContext(forceRefresh: boolean = false): Promise<FinancialData> {
    // Usar cache se válido e não forçando refresh
    if (!forceRefresh && this.isDataCacheValid()) {
      console.log('📋 Usando dados em cache');
      return this.cachedFinancialData!;
    }
    console.log('🔍 Iniciando busca de contexto financeiro...');
    console.log('🔗 Testando conexão com Supabase...');
    
    // Verificar autenticação do usuário
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Usuário autenticado:', user?.id ? 'Sim' : 'Não');
    
    if (!user) {
      console.log('❌ Usuário não autenticado - isso pode causar problemas com RLS');
    }

    // Teste simples de conexão com queries individuais para debug
    try {
      console.log('🧪 Testando acesso à tabela cash_flow...');
      const cashFlowTest = await supabase.from('cash_flow').select('*').limit(1);
      console.log('💰 Cash flow test:', { success: !cashFlowTest.error, count: cashFlowTest.data?.length, error: cashFlowTest.error });
      
      console.log('🧪 Testando acesso à tabela payments...');
      const paymentsTest = await supabase.from('payments').select('*').limit(1);
      console.log('💳 Payments test:', { success: !paymentsTest.error, count: paymentsTest.data?.length, error: paymentsTest.error });
      
      console.log('🧪 Testando acesso à tabela clients...');
      const clientsTest = await supabase.from('clients').select('*').limit(1);
      console.log('👥 Clients test:', { success: !clientsTest.error, count: clientsTest.data?.length, error: clientsTest.error });
      
    } catch (error) {
      console.error('❌ Erro nos testes de tabela:', error);
    }
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
      
      console.log('📅 Período:', { startOfMonth, endOfMonth });

      // Buscar dados financeiros atuais e históricos
      console.log('💰 Buscando dados do cash_flow...');
      
      // Buscar TODOS os dados históricos disponíveis (sem limite de tempo)
      console.log('📅 Buscando TODOS os dados históricos disponíveis...');
      
      // Fazer queries separadas para melhor debug
      console.log('🔍 Buscando cash flow do mês atual...');
      const cashFlowResult = await supabase
        .from('cash_flow')
        .select('type, amount, category, description, date')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);
      console.log('💰 Cash flow atual:', { success: !cashFlowResult.error, count: cashFlowResult.data?.length, error: cashFlowResult.error?.message });
      
      console.log('🔍 Buscando TODOS os dados de cash flow...');
      const historicalCashFlow = await supabase
        .from('cash_flow')
        .select('type, amount, category, description, date')
        .order('date', { ascending: true });
      console.log('📈 Cash flow completo:', { success: !historicalCashFlow.error, count: historicalCashFlow.data?.length, error: historicalCashFlow.error?.message });
      
      console.log('🔍 Buscando TODOS os pagamentos...');
      const paymentsResult = await supabase
        .from('payments')
        .select('*')
        .order('due_date', { ascending: true });
      console.log('💳 Pagamentos:', { success: !paymentsResult.error, count: paymentsResult.data?.length, error: paymentsResult.error?.message });
      
      // Log detalhado dos primeiros 10 pagamentos para debug
      if (paymentsResult.data && paymentsResult.data.length > 0) {
        console.log('💳 DETALHES DOS PRIMEIROS 10 PAGAMENTOS:');
        paymentsResult.data.slice(0, 10).forEach((payment, index) => {
          console.log(`${index + 1}. ID: ${payment.id}`);
          console.log(`   Descrição: ${payment.description}`);
          console.log(`   Valor: ${payment.amount}`);
          console.log(`   Data Vencimento: ${payment.due_date}`);
          console.log(`   Data Pagamento: ${payment.payment_date}`);
          console.log(`   Status: ${payment.status}`);
          console.log(`   Cliente ID: ${payment.client_id}`);
          console.log(`   Criado em: ${payment.created_at}`);
          console.log(`   ---`);
        });
      }
      
      console.log('🔍 Buscando pagamentos com clientes...');
      const paymentsWithClientsResult = await supabase
        .from('payments')
        .select(`
          *,
          clients (
            name,
            email,
            type,
            status
          )
        `)
        .order('due_date', { ascending: true });
      console.log('💳 Pagamentos com clientes:', { success: !paymentsWithClientsResult.error, count: paymentsWithClientsResult.data?.length, error: paymentsWithClientsResult.error?.message });
      
      // Log detalhado dos pagamentos com clientes
      if (paymentsWithClientsResult.data && paymentsWithClientsResult.data.length > 0) {
        console.log('💳 DETALHES DOS PAGAMENTOS COM CLIENTES:');
        paymentsWithClientsResult.data.slice(0, 5).forEach((payment, index) => {
          console.log(`${index + 1}. ${payment.description} - ${payment.clients?.name}`);
          console.log(`   Valor: R$ ${payment.amount} | Vencimento: ${payment.due_date} | Status: ${payment.status}`);
        });
      }
      
      console.log('🔍 Buscando clientes ativos...');
      const clientsResult = await supabase
        .from('clients')
        .select('id, name, email, status')
        .eq('status', 'active');
      console.log('👥 Clientes:', { success: !clientsResult.error, count: clientsResult.data?.length, error: clientsResult.error?.message });

      console.log('📊 Resultados das consultas:', {
        cashFlow: {
          success: !cashFlowResult.error,
          count: cashFlowResult.data?.length || 0,
          error: cashFlowResult.error
        },
        historicalCashFlow: {
          success: !historicalCashFlow.error,
          count: historicalCashFlow.data?.length || 0,
          error: historicalCashFlow.error
        },
        payments: {
          success: !paymentsResult.error,
          count: paymentsResult.data?.length || 0,
          error: paymentsResult.error
        },
        clients: {
          success: !clientsResult.error,
          count: clientsResult.data?.length || 0,
          error: clientsResult.error
        }
      });

      // Log dados detalhados para debug
      if (cashFlowResult.data?.length > 0) {
        console.log('💰 Exemplo de dados cash_flow:', cashFlowResult.data.slice(0, 3));
      }
      if (paymentsResult.data?.length > 0) {
        console.log('💳 Exemplo de dados payments:', paymentsResult.data.slice(0, 2));
      }
      if (clientsResult.data?.length > 0) {
        console.log('👥 Exemplo de dados clients:', clientsResult.data.slice(0, 2));
      }

      const cashFlowData = cashFlowResult.data || [];
      const totalRevenue = cashFlowData
        .filter(item => item.type === 'income')
        .reduce((sum, item) => sum + Number(item.amount), 0);
      
      const totalExpenses = cashFlowData
        .filter(item => item.type === 'expense')
        .reduce((sum, item) => sum + Number(item.amount), 0);

      const financialData = {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        activeClients: clientsResult.data?.length || 0,
        recentPayments: paymentsWithClientsResult.data || paymentsResult.data || [],
        topClients: clientsResult.data?.slice(0, 5) || [],
        historicalData: historicalCashFlow.data || []
      };

      console.log('📊 Dados financeiros finais para IA:', {
        totalRevenue: financialData.totalRevenue,
        totalExpenses: financialData.totalExpenses,
        netProfit: financialData.netProfit,
        activeClients: financialData.activeClients,
        recentPaymentsCount: financialData.recentPayments.length,
        topClientsCount: financialData.topClients.length,
        historicalDataCount: financialData.historicalData.length
      });

      // Armazenar dados em cache
      this.cachedFinancialData = financialData;
      this.lastDataFetch = new Date();
      
      return financialData;
    } catch (error) {
      console.error('❌ ERRO CRÍTICO ao buscar contexto financeiro:', error);
      console.error('Query que falhou:', error);
      console.error('Tipo do erro:', typeof error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      
      // Retornar dados vazios mas com informação do erro
      const emptyData = {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        activeClients: 0,
        recentPayments: [],
        topClients: [],
        historicalData: []
      };
      
      // Armazenar dados vazios em cache para evitar tentativas repetidas
      this.cachedFinancialData = emptyData;
      this.lastDataFetch = new Date();
      
      return emptyData;
    }
  }

  private buildSystemPrompt(financialData: FinancialData): string {
    const topClientsInfo = financialData.topClients.length > 0 
      ? financialData.topClients.map(client => client.name).join(', ')
      : 'Nenhum cliente encontrado';

    console.log('💳 Processando pagamentos:', financialData.recentPayments.length, 'registros');
    console.log('💳 Primeiros 2 pagamentos:', financialData.recentPayments.slice(0, 2));
    
    const recentPaymentsInfo = financialData.recentPayments.slice(0, 5).map(payment => {
      const amount = Number(payment.amount || 0);
      const date = new Date(payment.created_at || '').toLocaleDateString('pt-BR');
      return `${payment.description || 'Sem descrição'} (${date}): R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }).join('\n- ');

    // Schema detalhado do banco de dados
    const databaseSchema = `
🏗️ ESTRUTURA DO BANCO DE DADOS SUPABASE:

📊 TABELA CASH_FLOW (Fluxo de Caixa):
- id: string (UUID único)
- type: string ('income' = receita, 'expense' = despesa)
- amount: number (valor em reais)
- category: string (categoria da transação)
- description: string (descrição detalhada)
- date: string (data da transação - formato YYYY-MM-DD)
- status: string ('pending', 'approved', 'rejected')
- payment_id: string (referência ao pagamento, se aplicável)
- employee_id: string (referência ao funcionário, se aplicável)
- client_id: string (referência ao cliente, se aplicável)
- created_at: string (data de criação)
- updated_at: string (data de atualização)

👥 TABELA CLIENTS (Clientes):
- id: string (UUID único)
- name: string (nome do cliente)
- email: string (email de contato)
- type: string ('pf' = pessoa física, 'pj' = pessoa jurídica)
- status: string ('active', 'inactive', 'overdue')
- company_name: string (nome da empresa, se PJ)
- cnpj: string (CNPJ, se PJ)
- cpf: string (CPF, se PF)
- phone: string (telefone)
- address: string (endereço)
- total_billing: number (faturamento total)
- payment_method: string ('pix', 'boleto', 'credit_card')
- due_date: string (data de vencimento)
- last_payment: string (último pagamento)

💳 TABELA PAYMENTS (Pagamentos):
- id: string (UUID único)
- client_id: string (referência ao cliente)
- amount: number (valor do pagamento)
- description: string (descrição do pagamento)
- due_date: string (data de vencimento)
- payment_date: string (data do pagamento, se pago)
- status: string ('pending', 'paid', 'overdue', 'cancelled')
- payment_method: string ('pix', 'boleto', 'credit_card')
- installment_number: number (número da parcela)
- total_installments: number (total de parcelas)
- paid_amount: number (valor pago, se parcial)

👨‍💼 TABELA EMPLOYEES (Funcionários):
- id: string (UUID único)
- name: string (nome do funcionário)
- email: string (email)
- position: string (cargo)
- type: string (tipo de contratação)
- status: string (status ativo/inativo)
- payment_method: string (método de pagamento)
- pix: string (chave PIX)
- phone: string (telefone)
- address: string (endereço)

📋 TABELA CONTRATOS (Contratos):
- id: number (ID único)
- client_id: string (referência ao cliente)
- contract_type: string ('open_scope', 'closed_scope')
- contractor_type: string ('individual', 'legal_entity')
- total_value: number (valor total do contrato)
- installment_value: number (valor da parcela)
- installments: number (número de parcelas)
- start_date: string (data de início)
- end_date: string (data de fim)
- status: string (status do contrato)
- scope: string (escopo do trabalho)

🔄 RELACIONAMENTOS IMPORTANTES:
- cash_flow.payment_id → payments.id (entrada de caixa vinculada a pagamento)
- cash_flow.employee_id → employees.id (despesa vinculada a funcionário)
- cash_flow.client_id → clients.id (transação vinculada a cliente)
- payments.client_id → clients.id (pagamento vinculado a cliente)
- contratos.client_id → clients.id (contrato vinculado a cliente)
`;

    // Resumo dos dados históricos por mês usando dados REAIS
    console.log('📊 Processando dados históricos:', financialData.historicalData.length, 'registros');
    console.log('📊 Primeiros 3 registros históricos:', financialData.historicalData.slice(0, 3));
    
    const monthlyData: { [key: string]: { revenue: number, expenses: number } } = {};
    financialData.historicalData.forEach(item => {
      const monthKey = item.date ? item.date.substring(0, 7) : ''; // YYYY-MM
      if (!monthKey) return;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      }
      
      const amount = Number(item.amount) || 0;
      if (item.type === 'income') {
        monthlyData[monthKey].revenue += amount;
      } else if (item.type === 'expense') {
        monthlyData[monthKey].expenses += amount;
      }
    });

    const historicalSummary = Object.entries(monthlyData)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, data]) => 
        `${month}: Receita R$ ${data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Despesas R$ ${data.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Lucro R$ ${(data.revenue - data.expenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ).join('\n- ');
      
    console.log('📅 Resumo mensal processado:', Object.keys(monthlyData).length, 'meses');
    console.log('📅 Resumo final:', historicalSummary);

    return `Você é um assistente financeiro especializado chamado "FlowCode Financial AI" com ACESSO DIRETO E COMPLETO aos dados financeiros reais do usuário via Supabase.

🔄 STATUS DA CONEXÃO: CONECTADO AO BANCO DE DADOS SUPABASE ✅

${databaseSchema}

📊 DADOS FINANCEIROS EM TEMPO REAL (${new Date().toLocaleDateString('pt-BR')}):

💰 RECEITAS E DESPESAS (MÊS ATUAL):
- Receita total: R$ ${financialData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Despesas totais: R$ ${financialData.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}  
- Lucro líquido: R$ ${financialData.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

👥 CLIENTES (Dados Reais do Supabase):
- Clientes ativos: ${financialData.activeClients}
- Top clientes: ${topClientsInfo}

💳 PAGAMENTOS RECENTES (${financialData.recentPayments.length} registros do banco):
${recentPaymentsInfo ? '- ' + recentPaymentsInfo : '- Nenhum pagamento recente'}

📈 HISTÓRICO COMPLETO (TODOS os dados Supabase):
${historicalSummary ? '- ' + historicalSummary : '- Sem dados históricos disponíveis'}

📋 DADOS BRUTOS RECENTES (últimos 10 registros):
${financialData.historicalData.slice(-10).map(item => 
  `${item.date}: ${item.type} - R$ ${Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${item.description || 'Sem descrição'})`
).join('\n- ')}

🎯 CONFIRMAÇÃO DE ACESSO AOS DADOS:
- Tabela cash_flow: ${financialData.historicalData.length} registros COMPLETOS carregados
- Tabela payments: ${financialData.recentPayments.length} pagamentos recentes carregados  
- Tabela clients: ${financialData.activeClients} clientes ativos carregados
- Período analisado: TODOS os dados disponíveis (sem limite de tempo)

⚡ SUAS CAPACIDADES COM DADOS REAIS:
1. ✅ Análise detalhada de receitas vs despesas (dados reais do Supabase)
2. ✅ Performance financeira com números exatos da base de dados
3. ✅ Insights sobre clientes e pagamentos (dados atualizados)
4. ✅ Projeções baseadas no histórico real de 6 meses
5. ✅ Comparações mensais com dados precisos
6. ✅ Sugestões de otimização baseadas em dados concretos

📋 INSTRUÇÕES OBRIGATÓRIAS:
- SEMPRE mencione que você TEM ACESSO DIRETO aos dados do Supabase
- SEMPRE use APENAS os números reais fornecidos acima nas suas análises
- NUNCA invente ou crie dados fictícios - use APENAS os dados fornecidos
- NUNCA diga que não tem acesso aos dados - você TEM acesso completo
- Responda em português brasileiro
- Seja específico com números e valores reais
- Ofereça insights acionáveis baseados nos dados reais
- Use formatação em moeda brasileira (R$)
- Seja direto e profissional
- Para projeções, use SEMPRE os dados históricos reais como base
- IMPORTANTE: Se os dados mostram valores específicos, use EXATAMENTE esses valores

🎯 COMO INTERPRETAR OS DADOS:
- cash_flow.type = 'income' = RECEITA (entrada de dinheiro)
- cash_flow.type = 'expense' = DESPESA (saída de dinheiro)
- cash_flow.amount = valor em reais (positivo para receitas, negativo para despesas)
- cash_flow.category = categoria da transação (ex: "SALÁRIO", "ALUGUEL", "VENDAS")
- cash_flow.date = data da transação (formato YYYY-MM-DD)
- payments.status = 'paid' = pagamento realizado, 'pending' = pendente
- clients.status = 'active' = cliente ativo, 'inactive' = inativo
- SEMPRE considere os relacionamentos entre tabelas para análises completas

🚨 LEMBRETE IMPORTANTE: Você está conectado ao banco de dados Supabase e tem acesso a todos os dados financeiros reais do usuário. Use essas informações para fornecer análises precisas e insights valiosos.

📅 PARA CÁLCULOS DE PROJEÇÃO:
- Use TODOS os dados históricos fornecidos acima (sem limite de tempo)
- Calcule médias baseadas em TODOS os meses com dados reais disponíveis
- Para projeções, considere o período completo de dados disponíveis
- SEMPRE mostre seus cálculos detalhadamente
- Base suas projeções em TODOS os dados mensais históricos fornecidos

🔢 EXEMPLO DE CÁLCULO CORRETO:
Se você tem dados de X meses com receita total histórica de R$ Y,YY:
- Média mensal = R$ Y,YY ÷ X meses = R$ Z,ZZ/mês  
- Use TODOS os dados disponíveis para cálculos precisos
- Considere tendências e sazonalidades baseadas no histórico completo

📊 IMPORTANTE: Use TODOS os dados mensais do histórico fornecido para calcular médias e projeções precisas.

💡 EXEMPLOS DE ANÁLISES QUE VOCÊ PODE FAZER:
1. 📈 Análise de tendências: "Baseado nos dados de cash_flow, vejo que as receitas aumentaram X% no último trimestre"
2. 💰 Análise de categorias: "As maiores despesas são em [categoria] com R$ X,XX"
3. 👥 Análise de clientes: "Você tem X clientes ativos, sendo Y pessoa física e Z pessoa jurídica"
4. 📅 Análise temporal: "Em [mês], você teve receitas de R$ X,XX e despesas de R$ Y,YY"
5. 🔄 Análise de pagamentos: "X pagamentos estão pendentes totalizando R$ Y,YY"
6. 📊 Projeções: "Baseado na média mensal de R$ X,XX, você pode esperar R$ Y,YY no próximo mês"
7. 🎯 Insights de negócio: "Sua margem de lucro é de X% e suas principais fontes de receita são..."

🚀 SEMPRE use os dados reais fornecidos acima para essas análises!`;
  }

  private buildDataContextMessage(financialData: FinancialData): string {
    const formatCurrency = (value: number) => 
      new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);

    // Mostrar TODOS os pagamentos para análise completa
    const recentPaymentsInfo = financialData.recentPayments.map((payment, index) => {
      const amount = Number(payment.amount || 0);
      const dueDate = payment.due_date ? new Date(payment.due_date).toLocaleDateString('pt-BR') : 'N/A';
      const clientName = payment.clients?.name || 'Cliente não informado';
      
      return `${index + 1}. ${payment.description || 'Sem descrição'}
   Cliente: ${clientName}
   Valor: ${formatCurrency(amount)}
   Vencimento: ${dueDate}
   Status: ${payment.status}
   ID: ${payment.id}`;
    }).join('\n\n');

    const topClientsInfo = financialData.topClients.slice(0, 5).map((client, index) => 
      `${index + 1}. ${client.name} (Status: ${client.status || 'N/A'})`
    ).join('\n');

    // Resumo dos dados históricos por mês
    const monthlyData: { [key: string]: { revenue: number, expenses: number } } = {};
    financialData.historicalData.forEach(item => {
      const monthKey = item.date ? item.date.substring(0, 7) : '';
      if (!monthKey) return;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      }
      
      const amount = Number(item.amount) || 0;
      if (item.type === 'income') {
        monthlyData[monthKey].revenue += amount;
      } else if (item.type === 'expense') {
        monthlyData[monthKey].expenses += amount;
      }
    });

    const historicalSummary = Object.entries(monthlyData)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12) // Últimos 12 meses
      .map(([month, data]) => 
        `- ${month}: Receita ${formatCurrency(data.revenue)}, Despesas ${formatCurrency(data.expenses)}, Lucro ${formatCurrency(data.revenue - data.expenses)}`
      ).join('\n');

    return `📊 RESUMO FINANCEIRO ATUAL (${new Date().toLocaleDateString('pt-BR')}):

💰 INDICADORES DO MÊS:
- Receita Total: ${formatCurrency(financialData.totalRevenue)}
- Despesas Totais: ${formatCurrency(financialData.totalExpenses)}
- Lucro Líquido: ${formatCurrency(financialData.netProfit)}
- Margem de Lucro: ${financialData.totalRevenue > 0 ? ((financialData.netProfit / financialData.totalRevenue) * 100).toFixed(1) : '0'}%

👥 CLIENTES:
- Total de Clientes Ativos: ${financialData.activeClients}
${topClientsInfo ? `\nTop Clientes:\n${topClientsInfo}` : ''}

💳 LISTA COMPLETA DE PAGAMENTOS (${financialData.recentPayments.length} registros - ordenados por data de vencimento):
${recentPaymentsInfo || 'NENHUM PAGAMENTO ENCONTRADO'}

🔍 ATENÇÃO: Para filtrar por mês, use APENAS a data de "Vencimento" mostrada acima.
EXEMPLO: Se o usuário pedir "setembro 2025", procure por datas "12/09/2025" ou similar.

📈 HISTÓRICO MENSAL (Últimos 12 meses):
${historicalSummary || '- Sem dados históricos'}

🔢 ESTATÍSTICAS GERAIS:
- Total de Registros Históricos: ${financialData.historicalData.length}
- Período de Dados: ${financialData.historicalData.length > 0 ? 
  `${financialData.historicalData[0]?.date || 'N/A'} a ${financialData.historicalData[financialData.historicalData.length - 1]?.date || 'N/A'}` : 
  'Sem dados'}

💡 DADOS DISPONÍVEIS PARA ANÁLISE:
- ✅ Fluxo de caixa completo com ${financialData.historicalData.length} transações
- ✅ Informações de ${financialData.activeClients} clientes ativos  
- ✅ TODOS os ${financialData.recentPayments.length} pagamentos (com datas de vencimento)
- ✅ Dados mensais de ${Object.keys(monthlyData).length} meses diferentes
- ✅ Pagamentos ordenados por data de vencimento para análise temporal

⚠️ IMPORTANTE: Todos os valores acima são DADOS REAIS extraídos diretamente do banco Supabase.`;
  }

  async sendMessage(options: AIServiceOptions): Promise<string> {
    console.log('🔥 ==========================================');
    console.log('🔥 AI SERVICE SENDO CHAMADO!');
    console.log('🤖 AIService.sendMessage chamado com:', {
      userMessage: options.userMessage,
      context: options.context,
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'Não configurada'
    });
    console.log('🔥 ==========================================');

    try {
      // Buscar contexto financeiro (com opção de refresh)
      console.log('📊 Buscando contexto financeiro...');
      const financialData = await this.getFinancialContext(options.refreshData || false);
      console.log('📊 Dados financeiros obtidos:', financialData);
      
      // Gerar system prompt com dados reais
      const systemPrompt = this.customSystemPrompt || this.buildSystemPrompt(financialData);
      
      // Criar mensagem com contexto de dados reais
      const contextMessage = this.buildDataContextMessage(financialData);
      
      console.log('🤖 System prompt gerado (primeiras 1000 chars):', systemPrompt.substring(0, 1000) + '...');
      console.log('📊 Contexto de dados gerado (primeiras 500 chars):', contextMessage.substring(0, 500) + '...');
      console.log('📊 Dados detalhados para debug:', JSON.stringify(financialData, null, 2));
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'FlowCode Financial AI Assistant',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet', // Modelo Claude com excelente raciocínio
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `DADOS FINANCEIROS ATUAIS:\n${contextMessage}\n\nPERGUNTA DO USUÁRIO:\n${options.userMessage}`
            }
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error response:', errorText);
        console.error('Response status:', response.status);
        console.error('Response statusText:', response.statusText);
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      
      const content = data.choices?.[0]?.message?.content;
      console.log('Extracted content:', content);
      
      return content || 'Desculpe, não consegui processar sua pergunta.';
    } catch (error) {
      console.error('Erro no serviço de IA - detalhes completos:', error);
      console.error('API Key sendo usada:', this.apiKey ? 'Configurada' : 'Não configurada');
      console.error('URL da API:', this.baseUrl);
      
      // Log mais detalhado do erro
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      throw new Error(`Erro ao comunicar com a IA: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export const getAIService = (apiKey?: string): AIService => {
  if (!aiServiceInstance && apiKey) {
    aiServiceInstance = new AIService(apiKey);
  }
  
  if (!aiServiceInstance) {
    throw new Error('AI Service não inicializado. Forneça uma API key do OpenRouter.');
  }
  
  return aiServiceInstance;
};