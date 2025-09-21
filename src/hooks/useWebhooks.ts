import { useState, useEffect } from 'react';

interface WebhookConfig {
  prestacao_servico_criacao: string;
  prestacao_servico_assinatura: string;
  prestacao_servico_edicao: string;
  nda_criacao: string;
  nda_assinatura: string;
  nda_edicao: string;
  profissionais_criacao: string;
  profissionais_assinatura: string;
  profissionais_edicao: string;
}

type ContractType = 'prestacao_servico' | 'nda' | 'profissionais';
type WebhookAction = 'criacao' | 'assinatura' | 'edicao';

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookConfig>({
    prestacao_servico_criacao: '',
    prestacao_servico_assinatura: '',
    prestacao_servico_edicao: '',
    nda_criacao: '',
    nda_assinatura: '',
    nda_edicao: '',
    profissionais_criacao: '',
    profissionais_assinatura: '',
    profissionais_edicao: ''
  });

  // Carregar webhooks do localStorage na inicialização
  useEffect(() => {
    const loadedWebhooks: WebhookConfig = {
      prestacao_servico_criacao: localStorage.getItem('prestacao_servico_criacao_webhook') || '',
      prestacao_servico_assinatura: localStorage.getItem('prestacao_servico_assinatura_webhook') || '',
      prestacao_servico_edicao: localStorage.getItem('prestacao_servico_edicao_webhook') || '',
      nda_criacao: localStorage.getItem('nda_criacao_webhook') || '',
      nda_assinatura: localStorage.getItem('nda_assinatura_webhook') || '',
      nda_edicao: localStorage.getItem('nda_edicao_webhook') || '',
      profissionais_criacao: localStorage.getItem('profissionais_criacao_webhook') || '',
      profissionais_assinatura: localStorage.getItem('profissionais_assinatura_webhook') || '',
      profissionais_edicao: localStorage.getItem('profissionais_edicao_webhook') || ''
    };
    
    setWebhooks(loadedWebhooks);
  }, []);

  // Função para atualizar webhook de um tipo e ação específicos
  const updateWebhook = (type: ContractType, action: WebhookAction, url: string) => {
    const storageKey = `${type}_${action}_webhook`;
    const configKey = `${type}_${action}` as keyof WebhookConfig;
    
    localStorage.setItem(storageKey, url);
    
    setWebhooks(prev => ({
      ...prev,
      [configKey]: url
    }));
  };

  // Função para obter webhook de um tipo e ação específicos
  const getWebhook = (type: ContractType, action: WebhookAction): string => {
    const configKey = `${type}_${action}` as keyof WebhookConfig;
    return webhooks[configKey];
  };

  // Função para compatibilidade com NDA (manter funcionando)
  const getNDAWebhook = (): string => {
    return localStorage.getItem('nda_webhook_url') || '';
  };

  const updateNDAWebhook = (url: string) => {
    localStorage.setItem('nda_webhook_url', url);
  };

  return {
    webhooks,
    updateWebhook,
    getWebhook,
    // Compatibilidade com NDA
    getNDAWebhook,
    updateNDAWebhook
  };
}