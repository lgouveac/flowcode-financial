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
    if (!userMessage.trim() || isLoading) return;

    if (!options?.apiKey) {
      setError('API Key não configurada. Adicione VITE_OPENAI_API_KEY nas variáveis de ambiente.');
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

      if (options?.systemPrompt) {
        aiService.setCustomSystemPrompt(options.systemPrompt);
      }

      const forceRefresh = refreshData || localStorage.getItem('ai-force-refresh') === 'true';
      if (forceRefresh) {
        localStorage.removeItem('ai-force-refresh');
      }

      // Build conversation history from current messages (excluding the initial greeting)
      const conversationHistory = messages
        .slice(1) // skip initial greeting
        .map(msg => ({ role: msg.role, content: msg.content }));

      const response = await aiService.sendMessage({
        userMessage: userMessage.trim(),
        context: 'general',
        refreshData: forceRefresh,
        conversationHistory,
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
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Verifique sua API key.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [options?.apiKey, options?.systemPrompt, isLoading, messages]);

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
