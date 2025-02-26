
export type EmailTemplateType = 'clients' | 'employees';
export type EmailTemplateSubtype = 'recurring' | 'oneTime' | 'invoice' | 'hours';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: EmailTemplateType;
  subtype: EmailTemplateSubtype;
  created_at: string;
  updated_at: string;
  is_default?: boolean;
}

export interface Variable {
  name: string;
  description: string;
}

export type VariablesType = {
  [K in EmailTemplateType]: {
    [S in EmailTemplateSubtype]?: Variable[];
  };
};

export const variablesList: VariablesType = {
  clients: {
    recurring: [
      { name: '{nome_cliente}', description: 'Nome do cliente' },
      { name: '{valor_cobranca}', description: 'Valor da cobrança' },
      { name: '{data_vencimento}', description: 'Data de vencimento' },
      { name: '{plano_servico}', description: 'Descrição do serviço' },
      { name: '{numero_parcela}', description: 'Número da parcela atual' },
      { name: '{total_parcelas}', description: 'Total de parcelas' },
      { name: '{forma_pagamento}', description: 'Forma de pagamento' }
    ],
    oneTime: [
      { name: '{nome_cliente}', description: 'Nome do cliente' },
      { name: '{valor_cobranca}', description: 'Valor da cobrança' },
      { name: '{data_vencimento}', description: 'Data de vencimento' },
      { name: '{descricao_servico}', description: 'Descrição do serviço' },
      { name: '{forma_pagamento}', description: 'Forma de pagamento' }
    ]
  },
  employees: {
    invoice: [
      { name: '{nome_funcionario}', description: 'Nome do funcionário' },
      { name: '{valor_nota}', description: 'Valor da nota fiscal' },
      { name: '{data_nota}', description: 'Data da nota fiscal' }
    ],
    hours: [
      { name: '{nome_funcionario}', description: 'Nome do funcionário' },
      { name: '{total_horas}', description: 'Total de horas' },
      { name: '{periodo}', description: 'Período de referência' }
    ]
  }
};
