import { supabase } from '../lib/supabase';
import { WebhookLog, WebhookLogData } from '../types/webhook';

export class WebhookLogger {
  static async logWebhook(data: WebhookLogData): Promise<void> {
    try {
      const logEntry: Partial<WebhookLog> = {};

      // Preparar os dados para a coluna correspondente
      const webhookData = {
        contractId: data.contractId,
        contractType: data.contractType,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        status: data.status,
        timestamp: data.timestamp,
        webhookUrl: data.webhookUrl,
        response: data.response,
        error: data.error
      };

      // Salvar na coluna correspondente à ação
      switch (data.action) {
        case 'criacao_contrato':
          logEntry.criacao_contrato = JSON.stringify(webhookData);
          break;
        case 'edicao_contrato':
          logEntry.edicao_contrato = JSON.stringify(webhookData);
          break;
        case 'assinatura_contrato':
          logEntry.assinatura_contrato = JSON.stringify(webhookData);
          break;
      }

      const { error } = await supabase
        .from('webhooks')
        .insert([logEntry]);

      if (error) {
        console.error('Erro ao salvar webhook log:', error);
        throw error;
      }

      console.log('Webhook log salvo com sucesso:', logEntry);
    } catch (error) {
      console.error('Erro ao processar webhook log:', error);
      throw error;
    }
  }

  static async getWebhookLogs(action?: 'criacao_contrato' | 'edicao_contrato' | 'assinatura_contrato'): Promise<WebhookLog[]> {
    try {
      const query = supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar webhook logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao processar busca de webhook logs:', error);
      throw error;
    }
  }

  static async getRecentWebhookLogs(limit: number = 50): Promise<WebhookLog[]> {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao buscar webhook logs recentes:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao processar busca de webhook logs recentes:', error);
      throw error;
    }
  }
}