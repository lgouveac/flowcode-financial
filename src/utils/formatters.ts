
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
};

export const formatDate = (date: Date | string, formatString: string = 'dd/MM/yyyy') => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatString, { locale: ptBR });
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
};
