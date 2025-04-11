
import { Badge } from "@/components/ui/badge";
import React from "react";

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

export const getStatusBadge = (status: string): React.ReactNode => {
  switch (status) {
    case 'paid':
      return <Badge variant="success">Pago</Badge>;
    case 'pending':
      return <Badge variant="warning">Pendente</Badge>;
    case 'overdue':
      return <Badge variant="danger">Atrasado</Badge>;
    case 'cancelled':
      return <Badge variant="neutral">Cancelado</Badge>;
    case 'partially_paid':
      return <Badge variant="info">Pago Parcial</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};
