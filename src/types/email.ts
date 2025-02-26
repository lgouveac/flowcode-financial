
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
      { name: '{client_name}', description: 'Nome do cliente' },
      { name: '{billing_value}', description: 'Valor da cobrança' },
      { name: '{due_date}', description: 'Data de vencimento' },
      { name: '{invoice_number}', description: 'Número da fatura' }
    ],
    oneTime: [
      { name: '{client_name}', description: 'Nome do cliente' },
      { name: '{payment_value}', description: 'Valor do pagamento' },
      { name: '{due_date}', description: 'Data de vencimento' }
    ]
  },
  employees: {
    invoice: [
      { name: '{employee_name}', description: 'Nome do funcionário' },
      { name: '{invoice_value}', description: 'Valor da nota fiscal' },
      { name: '{invoice_date}', description: 'Data da nota fiscal' }
    ],
    hours: [
      { name: '{employee_name}', description: 'Nome do funcionário' },
      { name: '{total_hours}', description: 'Total de horas' },
      { name: '{period}', description: 'Período de referência' }
    ]
  }
};

