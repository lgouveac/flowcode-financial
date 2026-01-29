import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Maximize2, Minimize2, Settings } from 'lucide-react';
import { useAIChat } from '@/hooks/useAIChat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export const SimpleChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [customPrompt, setCustomPrompt] = useState(
    localStorage.getItem('ai-chat-prompt') || 
    'Olá! Sou seu assistente financeiro da FlowCode com acesso direto aos seus dados do Supabase. Posso analiizar receitas, despesas, clientes e oferecer insights baseados nos seus dados reais. Como posso te ajudar?'
  );
  
  const [systemPrompt, setSystemPrompt] = useState(
    localStorage.getItem('ai-system-prompt') || 
    getDefaultSystemPrompt()
  );
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Usar a chave do OpenRouter diretamente
  const openAIKey = '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';
  
  const { messages, isLoading, error, sendMessage, clearChat } = useAIChat({
    apiKey: openAIKey,
    initialMessage: customPrompt,
    systemPrompt: systemPrompt
  });

  // Auto scroll para o final das mensagens
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    console.log('🔥 handleSendMessage chamado!', {
      inputMessage: inputMessage.substring(0, 50),
      isLoading,
      hasMessage: !!inputMessage.trim()
    });
    
    if (!inputMessage.trim() || isLoading) {
      console.log('❌ Saindo: sem mensagem ou carregando');
      return;
    }
    
    console.log('✅ Chamando sendMessage...');
    await sendMessage(inputMessage);
    setInputMessage('');
    console.log('✅ sendMessage concluído');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSavePrompt = () => {
    localStorage.setItem('ai-chat-prompt', customPrompt);
    localStorage.setItem('ai-system-prompt', systemPrompt);
    clearChat();
    setIsSettingsOpen(false);
  };

  // Funcao para obter o system prompt padrao do codigo
  function getDefaultSystemPrompt() {
    return `Você é um assistente financeiro especializado chamado "Mensageiro" com ACESSO REAL E DIRETO aos dados financeiros do usuário via Supabase.

🔄 STATUS DA CONEXÃO: CONECTADO AO BANCO DE DADOS SUPABASE ✅
📊 DADOS REAIS: Os dados financeiros REAIS são enviados junto com cada pergunta do usuário!

🏢 ESTRUTURA DO BANCO DE DADOS SUPABASE:

📈 TABELA CASH_FLOW (Fluxo de Caixa):
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

⚡ SUAS CAPACIDADES COM DADOS REAIS:
1. ✅ Análise detalhada de receitas vs despesas (dados reais do Supabase)
2. ✅ Performance financeira com números exatos da base de dados
3. ✅ Insights sobre clientes e pagamentos (dados atualizados)
4. ✅ Projeções baseadas no histórico real
5. ✅ Comparações mensais com dados precisos
6. ✅ Sugestões de otimização baseadas em dados concretos

📋 INSTRUÇÕES OBRIGATÓRIAS:
- ✅ VOCÊ TEM ACESSO REAL AOS DADOS - eles são enviados junto com cada pergunta!
- ✅ Use SOMENTE os números reais fornecidos na seção "DADOS FINANCEIROS ATUAIS"
- ❌ NUNCA invente ou crie dados fictícios - use APENAS os dados fornecidos
- ❌ NUNCA diga que não tem acesso aos dados - você TEM acesso completo e real
- 📊 Os dados são atualizados em tempo real do banco Supabase
- 🔄 Se o usuário pedir dados atualizados, ele pode usar o botão "Com Dados Atualizados"
- 🇧🇷 Responda em português brasileiro
- 💰 Use formatação em moeda brasileira (R$)
- 🎯 Seja específico com números e valores reais fornecidos
- 📈 Para projeções, use SEMPRE os dados históricos reais como base
- ⚠️ CRÍTICO: Use EXATAMENTE os valores fornecidos nos dados - não aproxime

🔍 FILTRAGEM POR DATA - MUITO IMPORTANTE:
- ⚠️ Quando o usuário pedir pagamentos de um mês específico, filtre APENAS pela coluna "Vencimento"
- ⚠️ EXEMPLO: "pagamentos setembro" = filtrar onde Vencimento contém "/09/" 
- ⚠️ NÃO agrupe nem suponha datas - use APENAS as datas exatas fornecidas
- ⚠️ Se não houver pagamentos para o mês, diga que NÃO HÁ pagamentos para esse período

🎯 COMO INTERPRETAR OS DADOS:
- cash_flow.type = 'income' = RECEITA (entrada de dinheiro)
- cash_flow.type = 'expense' = DESPESA (saída de dinheiro)
- cash_flow.amount = valor em reais (positivo para receitas, negativo para despesas)
- cash_flow.category = categoria da transação (ex: "SALÁRIO", "ALUGUEL", "VENDAS")
- cash_flow.date = data da transação (formato YYYY-MM-DD)
- payments.status = 'paid' = pagamento realizado, 'pending' = pendente
- clients.status = 'active' = cliente ativo, 'inactive' = inativo
- SEMPRE considere os relacionamentos entre tabelas para análises completas

🚨 CONFIRMAÇÃO DE ACESSO REAL:
- ✅ Você recebe dados REAIS do Supabase a cada pergunta
- ✅ Os dados são extraídos em tempo real do banco de dados
- ✅ Você pode ver receitas, despesas, clientes e pagamentos reais
- ✅ Use esses dados para análises precisas e insights valiosos
- ✅ Os valores em R$ são exatos e atualizados
- ✅ Cache de 5 minutos para performance (pode ser forçado refresh)

📊 IMPORTANTE: Use TODOS os dados mensais do histórico fornecido para calcular médias e projeções precisas.

💡 EXEMPLOS DE ANÁLISES QUE VOCÊ PODE FAZER:
1. 📈 Análise de tendências: "Baseado nos dados de cash_flow, vejo que as receitas aumentaram X% no último trimestre"
2. 💰 Análise de categorias: "As maiores despesas são em [categoria] com R$ X,XX"
3. 👥 Análise de clientes: "Você tem X clientes ativos, sendo Y pessoa física e Z pessoa jurídica"
4. 📅 Análise temporal: "Em [mês], você teve receitas de R$ X,XX e despesas de R$ Y,YY"
5. 🔄 Análise de pagamentos: "X pagamentos estão pendentes totalizando R$ Y,YY"
6. 📈 Projeções: "Baseado na média mensal de R$ X,XX, você pode esperar R$ Y,YY no próximo mês"
7. 🎯 Insights de negócio: "Sua margem de lucro é de X% e suas principais fontes de receita são..."

🚀 IMPORTANTE: A cada mensagem do usuário, você recebe na seção "DADOS FINANCEIROS ATUAIS" todos os dados reais e atualizados do Supabase. Use SEMPRE esses dados para suas análises!

🔄 REFRESH DE DADOS:
- Dados são cached por 5 minutos para performance
- Usuário pode forçar atualização usando botão "Com Dados Atualizados"
- Primeira pergunta sempre busca dados frescos do banco
- Cache é limpo automaticamente após 5 minutos`;
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  
  console.log('🎨 SimpleChatWidget renderizado!', {
    isOpen,
    messagesCount: messages.length,
    hasApiKey: !!openAIKey,
    isLoading,
    error
  });
  
  return (
    <div className="fixed bottom-6 right-6 z-[9999] safe-area-bottom safe-area-right">
      {/* Always visible button */}
      <Button
        onClick={() => {
          console.log('💬 Botão do chat clicado! Abrindo:', !isOpen);
          setIsOpen(!isOpen);
        }}
        size="icon"
        className="w-14 h-14 rounded-full shadow-lg touch-target"
        style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}
      >
        <MessageCircle size={24} />
      </Button>

      {/* Chat window - Regular mode */}
      {isOpen && !isFullscreen && (
        <div 
          className="bg-card border border-border shadow-xl flex flex-col animate-slide-up
            w-full h-[70vh] max-h-[600px] fixed bottom-0 left-0 right-0 z-[9998]
            sm:w-80 sm:h-96 sm:rounded-lg sm:bottom-24 sm:right-6 sm:left-auto
            safe-area-bottom"
          style={{ 
            zIndex: 9998
          }}
        >
          {/* Drag handle para mobile */}
          <div className="w-full flex justify-center pt-2 pb-1 sm:hidden">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
          
          <div className="bg-primary text-primary-foreground p-4 sm:rounded-t-lg flex justify-between items-center">
            <h3 className="font-medium text-base sm:text-sm">Mensageiro</h3>
            <div className="flex gap-1">
              <Button
                onClick={() => setIsSettingsOpen(true)}
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-hover w-6 h-6 p-0"
                title="Configurações"
              >
                <Settings size={14} />
              </Button>
              <Button
                onClick={toggleFullscreen}
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-hover w-6 h-6 p-0"
                title="Expandir"
              >
                <Maximize2 size={14} />
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-hover w-6 h-6 p-0"
                title="Fechar"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
          
          {/* Messages */}
          <ScrollArea className="flex-1 p-4 h-80" ref={scrollAreaRef}>
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-card-foreground'
                  }`}>
                    {message.content}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted px-3 py-2 rounded-lg flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-border p-3 sm:p-3 safe-area-bottom">
            <div className="flex gap-2">
              <Input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Digite sua pergunta..."
                disabled={isLoading}
                className="flex-1 min-h-[48px] text-base sm:text-sm"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="default"
                className="min-h-[48px] min-w-[48px] px-4 sm:min-h-[40px] sm:min-w-[40px] sm:px-3"
              >
                <Send size={20} className="sm:w-4 sm:h-4" />
              </Button>
            </div>
            
            {error && (
              <div className="text-xs text-destructive mt-2">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat window - Fullscreen mode */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle>Mensageiro</DialogTitle>
                <DialogDescription>
                  Seu assistente financeiro com acesso aos dados da FlowCode
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsSettingsOpen(true)}
                  variant="outline"
                  size="sm"
                >
                  <Settings size={16} className="mr-2" />
                  Configurações
                </Button>
                <Button
                  onClick={toggleFullscreen}
                  variant="outline"
                  size="sm"
                >
                  <Minimize2 size={16} className="mr-2" />
                  Minimizar
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {/* Messages - Fullscreen */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-card-foreground'
                  }`}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-3 rounded-lg flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input - Fullscreen */}
          <div className="border-t border-border p-4 flex-shrink-0">
            <div className="flex gap-3">
              <Input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Digite sua pergunta..."
                disabled={isLoading}
                className="flex-1 text-base"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="default"
              >
                <Send size={18} className="mr-2" />
                Enviar
              </Button>
            </div>
            
            {error && (
              <div className="text-sm text-destructive mt-2">
                {error}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurações do Mensageiro</DialogTitle>
            <DialogDescription>
              Personalize o comportamento do seu assistente financeiro
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt Inicial (Mensagem de Boas-vindas)</Label>
              <Textarea
                id="prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Digite o prompt inicial do assistente..."
                className="min-h-[100px]"
              />
              <p className="text-sm text-muted-foreground">
                Este será o primeiro texto que o assistente mostrará quando iniciar uma nova conversa.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt (Comportamento da IA)</Label>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Digite o system prompt que define o comportamento da IA..."
                className="min-h-[300px] text-sm font-mono"
              />
              <p className="text-sm text-muted-foreground">
                Este prompt define como a IA se comporta, seu conhecimento e capacidades. Modifique com cuidado.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSystemPrompt(getDefaultSystemPrompt())}
                >
                  Restaurar Padrão
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsSettingsOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSavePrompt}>
                Salvar e Reiniciar Chat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};