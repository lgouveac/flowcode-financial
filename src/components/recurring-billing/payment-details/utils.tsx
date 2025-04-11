
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
      return <Badge className="bg-green-500">Pago</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-500">Pendente</Badge>;
    case 'overdue':
      return <Badge className="bg-red-500">Atrasado</Badge>;
    case 'cancelled':
      return <Badge className="bg-gray-500">Cancelado</Badge>;
    case 'partially_paid':
      return <Badge className="bg-blue-500">Pago Parcial</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};
