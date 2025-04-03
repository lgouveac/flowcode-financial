
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-500';
    case 'pending':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

export const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'pix':
      return 'PIX';
    case 'boleto':
      return 'Boleto';
    case 'credit_card':
      return 'Cartão de Crédito';
    default:
      return method;
  }
};
