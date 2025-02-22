
export interface Payment {
  id: string;
  client_id: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  payment_method: 'pix' | 'boleto' | 'credit_card';
  status: 'pending' | 'billed' | 'awaiting_invoice' | 'paid' | 'overdue' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  installment_number?: number;
  total_installments?: number;
}

export type NewPayment = Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
