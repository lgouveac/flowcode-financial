import { useState, useCallback } from 'react';
import { getAIService } from '@/services/aiService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseAIChatOptions {
  apiKey?: string;
  initialMessage?: string;
  systemPrompt?: string;
}

export const useAIChat = (options?: UseAIChatOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: options?.initialMessage || 'Olá! Sou seu assistente financeiro. Posso ajudar você a analisar receitas, despesas, clientes e muito mais. Como posso te ajudar hoje?',
      timestamp: new Date()
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (userMessage: string, refreshData: boolean = false) => {
    console.log('🚀 =================');
    console.log('🚀 useAIChat.sendMessage INICIADO');
    console.log('💬 useAIChat.sendMessage chamado com:', {
      userMessage: userMessage.substring(0, 50) + '...',
      isLoading,
      hasApiKey: !!options?.apiKey,
      apiKeyPrefix: options?.apiKey ? options.apiKey.substring(0, 10) + '...' : 'Não configurada'
    });
    console.log('🚀 =================');

    if (!userMessage.trim() || isLoading) return;
    
    if (!options?.apiKey) {
      console.error('❌ API Key não configurada');
      setError('API Key do OpenRouter não configurada');
      return;
    }

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const aiService = getAIService(options.apiKey);
      
      // Definir o system prompt personalizado se fornecido
      if (options?.systemPrompt) {
        aiService.setCustomSystemPrompt(options.systemPrompt);
      }
      
      // Verificar se deve forçar refresh dos dados
      const forceRefresh = refreshData || localStorage.getItem('ai-force-refresh') === 'true';
      if (forceRefresh) {
        localStorage.removeItem('ai-force-refresh');
      }
      
      const response = await aiService.sendMessage({
        userMessage: userMessage.trim(),
        context: 'general',
        refreshData: forceRefresh
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Verifique se sua API key do OpenRouter está configurada corretamente.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [options?.apiKey, isLoading]);

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: options?.initialMessage || 'Olá! Como posso te ajudar com suas finanças hoje?',
        timestamp: new Date()
      }
    ]);
    setError(null);
  }, [options?.initialMessage]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat
  };
};