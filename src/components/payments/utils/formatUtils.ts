
import { format } from "date-fns";

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800 hover:bg-green-200/80";
    case "partially_paid":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200/80";
    case "pending":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200/80";
    case "billed":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200/80";
    case "awaiting_invoice":
      return "bg-orange-100 text-orange-800 hover:bg-orange-200/80";
    case "overdue":
      return "bg-red-100 text-red-800 hover:bg-red-200/80";
    case "cancelled":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200/80";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200/80";
  }
};

export const getPaymentMethodLabel = (method: string): string => {
  switch (method) {
    case "pix":
      return "PIX";
    case "boleto":
      return "Boleto";
    case "credit_card":
      return "Cartão de Crédito";
    default:
      return method;
  }
};

export const formatDateString = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    // Explicitly format to dd/MM/yyyy without time
    return format(date, "dd/MM/yyyy");
  } catch (e) {
    return dateStr;
  }
};

// Additional utility to strip time from a date string
export const stripTimeFromDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return format(date, "dd/MM/yyyy");
  } catch (e) {
    return dateStr.split('T')[0].split(' ')[0];
  }
};
