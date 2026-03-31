import { supabase } from '@/integrations/supabase/client';

interface AIServiceOptions {
  userMessage: string;
  context?: 'dashboard' | 'payments' | 'clients' | 'expenses' | 'general';
  refreshData?: boolean;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
}

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeClients: number;
  recentPayments: Record<string, unknown>[];
  topClients: Record<string, unknown>[];
  historicalData: Record<string, unknown>[];
}

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';
  private customSystemPrompt: string | null = null;
  private cachedFinancialData: FinancialData | null = null;
  private lastDataFetch: Date | null = null;
  private readonly DATA_CACHE_DURATION = 5 * 60 * 1000;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.customSystemPrompt = localStorage.getItem('ai-system-prompt');
  }

  setCustomSystemPrompt(prompt: string) {
    this.customSystemPrompt = prompt;
    localStorage.setItem('ai-system-prompt', prompt);
  }

  refreshData() {
    this.cachedFinancialData = null;
    this.lastDataFetch = null;
  }

  private isDataCacheValid(): boolean {
    return this.cachedFinancialData !== null &&
           this.lastDataFetch !== null &&
           (Date.now() - this.lastDataFetch.getTime()) < this.DATA_CACHE_DURATION;
  }

  private async getFinancialContext(forceRefresh: boolean = false): Promise<FinancialData> {
    if (!forceRefresh && this.isDataCacheValid()) {
      return this.cachedFinancialData!;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('Usuário não autenticado — dados podem estar vazios por RLS');
    }

    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

      const [cashFlowResult, historicalCashFlow, paymentsResult, paymentsWithClientsResult, clientsResult] = await Promise.all([
        supabase
          .from('cash_flow')
          .select('type, amount, category, description, date')
          .gte('date', startOfMonth)
          .lte('date', endOfMonth),
        supabase
          .from('cash_flow')
          .select('type, amount, category, description, date')
          .order('date', { ascending: true }),
        supabase
          .from('payments')
          .select('*')
          .order('due_date', { ascending: true }),
        supabase
          .from('payments')
          .select(`*, clients (name, email, type, status)`)
          .order('due_date', { ascending: true }),
        supabase
          .from('clients')
          .select('id, name, email, status')
          .eq('status', 'active'),
      ]);

      const cashFlowData = cashFlowResult.data || [];
      const totalRevenue = cashFlowData
        .filter(item => item.type === 'income')
        .reduce((sum, item) => sum + Number(item.amount), 0);
      const totalExpenses = cashFlowData
        .filter(item => item.type === 'expense')
        .reduce((sum, item) => sum + Number(item.amount), 0);

      const financialData: FinancialData = {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        activeClients: clientsResult.data?.length || 0,
        recentPayments: paymentsWithClientsResult.data || paymentsResult.data || [],
        topClients: clientsResult.data?.slice(0, 5) || [],
        historicalData: historicalCashFlow.data || []
      };

      this.cachedFinancialData = financialData;
      this.lastDataFetch = new Date();
      return financialData;
    } catch (error) {
      console.error('Erro ao buscar contexto financeiro:', error);
      const emptyData: FinancialData = {
        totalRevenue: 0, totalExpenses: 0, netProfit: 0,
        activeClients: 0, recentPayments: [], topClients: [], historicalData: []
      };
      this.cachedFinancialData = emptyData;
      this.lastDataFetch = new Date();
      return emptyData;
    }
  }

  private buildSystemPrompt(financialData: FinancialData): string {
    const topClientsInfo = financialData.topClients.length > 0
      ? financialData.topClients.map(client => client.name).join(', ')
      : 'Nenhum cliente encontrado';

    const recentPaymentsInfo = financialData.recentPayments.slice(0, 5).map(payment => {
      const amount = Number(payment.amount || 0);
      const date = payment.due_date ? new Date(payment.due_date as string).toLocaleDateString('pt-BR') : 'N/A';
      return `${payment.description || 'Sem descrição'} (${date}): R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }).join('\n- ');

    const monthlyData: { [key: string]: { revenue: number, expenses: number } } = {};
    financialData.historicalData.forEach(item => {
      const monthKey = item.date ? (item.date as string).substring(0, 7) : '';
      if (!monthKey) return;
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      const amount = Number(item.amount) || 0;
      if (item.type === 'income') monthlyData[monthKey].revenue += amount;
      else if (item.type === 'expense') monthlyData[monthKey].expenses += amount;
    });

    const historicalSummary = Object.entries(monthlyData)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, data]) =>
        `${month}: Receita R$ ${data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Despesas R$ ${data.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Lucro R$ ${(data.revenue - data.expenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ).join('\n- ');

    return `Você é o assistente financeiro "Mensageiro" da FlowCode Financial. Você tem acesso direto aos dados financeiros reais do usuário via Supabase.

DADOS FINANCEIROS EM TEMPO REAL (${new Date().toLocaleDateString('pt-BR')}):

RECEITAS E DESPESAS (MÊS ATUAL):
- Receita total: R$ ${financialData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Despesas totais: R$ ${financialData.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Lucro líquido: R$ ${financialData.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

CLIENTES:
- Clientes ativos: ${financialData.activeClients}
- Top clientes: ${topClientsInfo}

PAGAMENTOS RECENTES (${financialData.recentPayments.length} registros):
${recentPaymentsInfo ? '- ' + recentPaymentsInfo : '- Nenhum pagamento recente'}

HISTÓRICO MENSAL:
${historicalSummary ? '- ' + historicalSummary : '- Sem dados históricos'}

DADOS BRUTOS RECENTES (últimos 10 registros):
${financialData.historicalData.slice(-10).map(item =>
  `${item.date}: ${item.type} - R$ ${Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${item.description || 'Sem descrição'})`
).join('\n')}

SCHEMA DO BANCO:
- cash_flow: id, type (income/expense), amount, category, description, date, status, payment_id, employee_id, client_id
- clients: id, name, email, type (pf/pj), status, company_name, cnpj, cpf, phone, total_billing, payment_method
- payments: id, client_id, amount, description, due_date, payment_date, status (pending/paid/overdue/cancelled), installment_number, total_installments
- employees: id, name, email, position, type, status, payment_method, pix, phone
- contratos: id, client_id, contract_type, contractor_type, total_value, installment_value, installments, start_date, end_date, status, scope

RELACIONAMENTOS: payments.client_id → clients.id, cash_flow.payment_id → payments.id, cash_flow.employee_id → employees.id, contratos.client_id → clients.id

INSTRUÇÕES:
- Use APENAS os dados reais fornecidos acima, nunca invente dados
- Responda em português brasileiro
- Seja direto e profissional
- Use formatação R$ para valores monetários
- Para projeções, baseie-se no histórico real
- Quando filtrar por data, use a coluna de vencimento (due_date) dos pagamentos
- Mantenha contexto da conversa — o usuário pode fazer perguntas de acompanhamento`;
  }

  private buildDataContextMessage(financialData: FinancialData): string {
    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

    const recentPaymentsInfo = financialData.recentPayments.map((payment, index) => {
      const amount = Number(payment.amount || 0);
      const dueDate = payment.due_date ? new Date(payment.due_date as string).toLocaleDateString('pt-BR') : 'N/A';
      const clientName = (payment.clients as Record<string, unknown>)?.name || 'Cliente não informado';
      return `${index + 1}. ${payment.description || 'Sem descrição'} | Cliente: ${clientName} | ${formatCurrency(amount)} | Vencimento: ${dueDate} | Status: ${payment.status}`;
    }).join('\n');

    const topClientsInfo = financialData.topClients.slice(0, 5).map((client, index) =>
      `${index + 1}. ${client.name} (${client.status || 'N/A'})`
    ).join('\n');

    const monthlyData: { [key: string]: { revenue: number, expenses: number } } = {};
    financialData.historicalData.forEach(item => {
      const monthKey = item.date ? (item.date as string).substring(0, 7) : '';
      if (!monthKey) return;
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      const amount = Number(item.amount) || 0;
      if (item.type === 'income') monthlyData[monthKey].revenue += amount;
      else if (item.type === 'expense') monthlyData[monthKey].expenses += amount;
    });

    const historicalSummary = Object.entries(monthlyData)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12)
      .map(([month, data]) =>
        `- ${month}: Receita ${formatCurrency(data.revenue)}, Despesas ${formatCurrency(data.expenses)}, Lucro ${formatCurrency(data.revenue - data.expenses)}`
      ).join('\n');

    return `RESUMO FINANCEIRO (${new Date().toLocaleDateString('pt-BR')}):

Receita: ${formatCurrency(financialData.totalRevenue)} | Despesas: ${formatCurrency(financialData.totalExpenses)} | Lucro: ${formatCurrency(financialData.netProfit)} | Margem: ${financialData.totalRevenue > 0 ? ((financialData.netProfit / financialData.totalRevenue) * 100).toFixed(1) : '0'}%

Clientes ativos: ${financialData.activeClients}
${topClientsInfo ? `Top clientes:\n${topClientsInfo}` : ''}

PAGAMENTOS (${financialData.recentPayments.length} registros):
${recentPaymentsInfo || 'Nenhum pagamento'}

HISTÓRICO MENSAL:
${historicalSummary || '- Sem dados históricos'}

Total de registros: ${financialData.historicalData.length} | Período: ${financialData.historicalData.length > 0 ? `${financialData.historicalData[0]?.date || 'N/A'} a ${financialData.historicalData[financialData.historicalData.length - 1]?.date || 'N/A'}` : 'Sem dados'}`;
  }

  async sendMessage(options: AIServiceOptions): Promise<string> {
    try {
      const financialData = await this.getFinancialContext(options.refreshData || false);
      const systemPrompt = this.customSystemPrompt || this.buildSystemPrompt(financialData);
      const contextMessage = this.buildDataContextMessage(financialData);

      // Build messages array with conversation history
      const messages: { role: string; content: string }[] = [
        { role: 'system', content: systemPrompt }
      ];

      // Add conversation history (last 20 messages to stay within token limits)
      if (options.conversationHistory && options.conversationHistory.length > 0) {
        const recentHistory = options.conversationHistory.slice(-20);
        for (const msg of recentHistory) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }

      // Add current message with financial context
      messages.push({
        role: 'user',
        content: `DADOS FINANCEIROS ATUAIS:\n${contextMessage}\n\nPERGUNTA DO USUÁRIO:\n${options.userMessage}`
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua pergunta.';
    } catch (error) {
      console.error('Erro no serviço de IA:', error);
      throw new Error(`Erro ao comunicar com a IA: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}

let aiServiceInstance: AIService | null = null;

export const getAIService = (apiKey?: string): AIService => {
  if (!aiServiceInstance && apiKey) {
    aiServiceInstance = new AIService(apiKey);
  }
  if (aiServiceInstance && apiKey && apiKey !== (aiServiceInstance as unknown as { apiKey: string }).apiKey) {
    aiServiceInstance = new AIService(apiKey);
  }
  if (!aiServiceInstance) {
    throw new Error('AI Service não inicializado. Forneça uma API key.');
  }
  return aiServiceInstance;
};
