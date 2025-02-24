
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'clients' | 'employees';
  subtype: 'recurring' | 'oneTime' | 'invoice' | 'hours';
}

export interface Variable {
  name: string;
  description: string;
}

export const variablesList = {
  clients: {
    recurring: [
      { name: "{nome_cliente}", description: "Nome do cliente" },
      { name: "{valor_cobranca}", description: "Valor da cobrança" },
      { name: "{data_vencimento}", description: "Data de vencimento" },
      { name: "{plano_servico}", description: "Plano/Serviço contratado" },
      { name: "{periodo_referencia}", description: "Período de referência" },
      { name: "{numero_parcela}", description: "Número da parcela atual" },
      { name: "{total_parcelas}", description: "Total de parcelas" },
      { name: "{forma_pagamento}", description: "Forma de pagamento" }
    ],
    oneTime: [
      { name: "{nome_cliente}", description: "Nome do cliente" },
      { name: "{valor_cobranca}", description: "Valor da cobrança" },
      { name: "{data_vencimento}", description: "Data de vencimento" },
      { name: "{descricao_servico}", description: "Descrição do serviço" },
      { name: "{numero_pedido}", description: "Número do pedido" },
      { name: "{forma_pagamento}", description: "Forma de pagamento" }
    ]
  },
  employees: {
    invoice: [
      { name: "{nome_funcionario}", description: "Nome do funcionário" },
      { name: "{mes_referencia}", description: "Mês de referência" },
      { name: "{valor_nota}", description: "Valor da nota fiscal" }
    ],
    hours: [
      { name: "{nome_funcionario}", description: "Nome do funcionário" },
      { name: "{mes_referencia}", description: "Mês de referência" },
      { name: "{total_horas}", description: "Total de horas" }
    ]
  }
};

