
export const formatCurrency = (value: number): string => {
  if (value === undefined || value === null) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Pendente',
    'paid': 'Pago',
    'billed': 'Faturado',
    'awaiting_invoice': 'Aguardando Fatura',
    'overdue': 'Atrasado',
    'cancelled': 'Cancelado',
    'partially_paid': 'Pago Parcial'
  };

  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'billed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'awaiting_invoice':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'overdue':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    case 'partially_paid':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export const getPaymentMethodLabel = (method: 'pix' | 'boleto' | 'credit_card'): string => {
  switch (method) {
    case 'pix':
      return 'PIX';
    case 'boleto':
      return 'Boleto';
    case 'credit_card':
      return 'Cartão de Crédito';
    default:
      return 'Desconhecido';
  }
};
