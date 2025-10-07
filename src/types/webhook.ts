export interface WebhookLog {
  id?: number;
  criacao_contrato?: string | null;
  edicao_contrato?: string | null;
  assinatura_contrato?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WebhookLogData {
  action: 'criacao_contrato' | 'edicao_contrato' | 'assinatura_contrato';
  contractId?: string;
  contractType?: string;
  clientName?: string;
  clientEmail?: string;
  status?: string;
  timestamp: string;
  webhookUrl: string;
  response?: any;
  error?: string;
}