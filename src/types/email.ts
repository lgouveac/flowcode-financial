
export type EmailTemplateType = 'clients' | 'employees';
export type EmailTemplateSubtype = 'recurring' | 'oneTime' | 'invoice' | 'hours' | 'reminder' | 'contract' | 'novo_subtipo';

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

// Adding all client fields (CNPJ, CPF, endereço, nome do sócio, etc) to recurring, oneTime, and contract
export const variablesList: VariablesType = {
  clients: {
    recurring: [
      { name: '{nome_cliente}', description: 'Nome do cliente' },
      { name: '{nome_responsavel}', description: 'Nome do responsável' },
      { name: '{valor_cobranca}', description: 'Valor da cobrança' },
      { name: '{data_vencimento}', description: 'Data de vencimento' },
      { name: '{plano_servico}', description: 'Descrição do serviço' },
      { name: '{numero_parcela}', description: 'Número da parcela atual' },
      { name: '{total_parcelas}', description: 'Total de parcelas' },
      { name: '{forma_pagamento}', description: 'Forma de pagamento' },
      // Additional client variables:
      { name: '{cnpj}', description: 'CNPJ do cliente' },
      { name: '{cpf}', description: 'CPF do cliente' },
      { name: '{endereco}', description: 'Endereço do cliente' },
      { name: '{partner_name}', description: 'Nome do sócio/partner' },
      { name: '{partner_cpf}', description: 'CPF do sócio/partner' },
      { name: '{company_name}', description: 'Razão social/Nome da empresa' },
      { name: '{valor_mensal}', description: 'Valor mensal do contrato' },
      { name: '{data_inicio}', description: 'Data de início do contrato' }
    ],
    oneTime: [
      { name: '{nome_cliente}', description: 'Nome do cliente' },
      { name: '{nome_responsavel}', description: 'Nome do responsável' },
      { name: '{valor_cobranca}', description: 'Valor da cobrança' },
      { name: '{data_vencimento}', description: 'Data de vencimento' },
      { name: '{descricao_servico}', description: 'Descrição do serviço' },
      { name: '{forma_pagamento}', description: 'Forma de pagamento' },
      // Additional client variables:
      { name: '{cnpj}', description: 'CNPJ do cliente' },
      { name: '{cpf}', description: 'CPF do cliente' },
      { name: '{endereco}', description: 'Endereço do cliente' },
      { name: '{partner_name}', description: 'Nome do sócio/partner' },
      { name: '{partner_cpf}', description: 'CPF do sócio/partner' },
      { name: '{company_name}', description: 'Razão social/Nome da empresa' },
      { name: '{valor_mensal}', description: 'Valor mensal do contrato' },
      { name: '{data_inicio}', description: 'Data de início do contrato' }
    ],
    reminder: [
      { name: '{nome_cliente}', description: 'Nome do cliente' },
      { name: '{nome_responsavel}', description: 'Nome do responsável' },
      { name: '{valor_cobranca}', description: 'Valor da cobrança' },
      { name: '{data_vencimento}', description: 'Data de vencimento' },
      { name: '{dias_atraso}', description: 'Dias em atraso' },
      { name: '{descricao_servico}', description: 'Descrição do serviço' },
      { name: '{forma_pagamento}', description: 'Forma de pagamento' },
      // Additional client variables:
      { name: '{cnpj}', description: 'CNPJ do cliente' },
      { name: '{cpf}', description: 'CPF do cliente' },
      { name: '{endereco}', description: 'Endereço do cliente' },
      { name: '{partner_name}', description: 'Nome do sócio/partner' },
      { name: '{partner_cpf}', description: 'CPF do sócio/partner' },
      { name: '{company_name}', description: 'Razão social/Nome da empresa' },
      { name: '{valor_mensal}', description: 'Valor mensal do contrato' },
      { name: '{data_inicio}', description: 'Data de início do contrato' }
    ],
    contract: [
      { name: '{nome_cliente}', description: 'Nome do cliente' },
      { name: '{nome_responsavel}', description: 'Nome do responsável' },
      { name: '{cnpj}', description: 'CNPJ do cliente' },
      { name: '{cpf}', description: 'CPF do cliente' },
      { name: '{endereco}', description: 'Endereço do cliente' },
      { name: '{partner_name}', description: 'Nome do sócio/partner' },
      { name: '{partner_cpf}', description: 'CPF do sócio/partner' },
      { name: '{company_name}', description: 'Razão social/Nome da empresa' },
      { name: '{valor_mensal}', description: 'Valor mensal do contrato' },
      { name: '{data_inicio}', description: 'Data de início do contrato' },
      { name: '{forma_pagamento}', description: 'Forma de pagamento' }
    ],
    novo_subtipo: [
      { name: '{nome_cliente}', description: 'Nome do cliente' },
      { name: '{nome_responsavel}', description: 'Nome do responsável' },
      { name: '{cnpj}', description: 'CNPJ do cliente' },
      { name: '{cpf}', description: 'CPF do cliente' },
      { name: '{endereco}', description: 'Endereço do cliente' },
      { name: '{partner_name}', description: 'Nome do sócio/partner' },
      { name: '{partner_cpf}', description: 'CPF do sócio/partner' },
      { name: '{company_name}', description: 'Razão social/Nome da empresa' },
      { name: '{valor_cobranca}', description: 'Valor da cobrança' },
      { name: '{data_vencimento}', description: 'Data de vencimento' },
      { name: '{forma_pagamento}', description: 'Forma de pagamento' }
    ]
  },
  employees: {
    invoice: [
      { name: '{nome_funcionario}', description: 'Nome do funcionário' },
      { name: '{valor_nota}', description: 'Valor da nota fiscal' },
      { name: '{valor_mensal}', description: 'Valor mensal do funcionário' },
      { name: '{data_nota}', description: 'Data da nota fiscal' },
      { name: '{mes_referencia}', description: 'Mês de referência' },
      { name: '{posicao}', description: 'Cargo/função do funcionário' },
      { name: '{observacoes}', description: 'Observações adicionais' },
      { name: '{email_funcionario}', description: 'Email do funcionário' },
      { name: '{phone}', description: 'Telefone do funcionário' },
      { name: '{address}', description: 'Endereço do funcionário' },
      { name: '{pix}', description: 'Chave PIX do funcionário' },
      { name: '{cnpj}', description: 'CNPJ do funcionário' },
      { name: '{payment_method}', description: 'Método de pagamento' }
    ],
    hours: [
      { name: '{nome_funcionario}', description: 'Nome do funcionário' },
      { name: '{total_horas}', description: 'Total de horas' },
      { name: '{periodo}', description: 'Período de referência' },
      { name: '{valor_mensal}', description: 'Valor mensal do funcionário' },
      { name: '{email_funcionario}', description: 'Email do funcionário' },
      { name: '{phone}', description: 'Telefone do funcionário' },
      { name: '{address}', description: 'Endereço do funcionário' },
      { name: '{posicao}', description: 'Cargo/função do funcionário' },
      { name: '{pix}', description: 'Chave PIX do funcionário' },
      { name: '{cnpj}', description: 'CNPJ do funcionário' },
      { name: '{payment_method}', description: 'Método de pagamento' }
    ],
    novo_subtipo: [
      { name: '{nome_funcionario}', description: 'Nome do funcionário' },
      { name: '{email_funcionario}', description: 'Email do funcionário' },
      { name: '{phone}', description: 'Telefone do funcionário' },
      { name: '{address}', description: 'Endereço do funcionário' },
      { name: '{posicao}', description: 'Cargo/função do funcionário' },
      { name: '{pix}', description: 'Chave PIX do funcionário' },
      { name: '{cnpj}', description: 'CNPJ do funcionário' },
      { name: '{valor_mensal}', description: 'Valor mensal do funcionário' },
      { name: '{payment_method}', description: 'Método de pagamento' },
      { name: '{mes_referencia}', description: 'Mês de referência' },
      { name: '{valor_nota}', description: 'Valor da nota fiscal' },
      { name: '{data_nota}', description: 'Data da nota fiscal' }
    ]
  }
};
