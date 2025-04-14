
import type { Record } from "../types/emailTest";
import { formatCurrency } from "@/components/payments/utils/formatUtils";

export const getRecordLabel = (record: Record): string => {
  if (!('client' in record)) {
    // Employee case
    return record.name;
  }
  
  // For client records (billing or payment)
  const amount = formatCurrency(record.amount);
  
  if ('due_day' in record) {
    // Recurring billing
    return `[Recorrente] ${record.client.name} - ${record.description} (${amount})`;
  } else {
    // One-time payment
    const dueDate = new Date(record.due_date).toLocaleDateString('pt-BR');
    return `[Pontual] ${record.client.name} - ${record.description} (${amount}) - Venc: ${dueDate}`;
  }
};
