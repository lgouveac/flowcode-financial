
interface Category {
  value: string;
  label: string;
}

type CategoryGroup = {
  [key: string]: Category[];
};

export const CATEGORIES: CategoryGroup = {
  income: [
    { value: 'payment', label: 'Recebimento' },
    { value: 'service', label: 'Serviço' },
    { value: 'investment', label: 'Investimento' },
    { value: 'refund', label: 'Reembolso' },
    { value: 'other', label: 'Outro' },
  ],
  expense: [
    { value: 'employee', label: 'Funcionário' },
    { value: 'service', label: 'Serviço' },
    { value: 'subscription', label: 'Assinatura' },
    { value: 'material', label: 'Material' },
    { value: 'tax', label: 'Imposto' },
    { value: 'food', label: 'Alimentação' },
    { value: 'transport', label: 'Transporte' },
    { value: 'utility', label: 'Utilidade' },
    { value: 'rent', label: 'Aluguel' },
    { value: 'other', label: 'Outro' },
  ],
};
