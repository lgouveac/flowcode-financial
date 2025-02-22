
export interface Payment {
  id: string;
  client_id: string;
  description: string;
  amount: number;
  due_date: string;
  payment_method: 'pix' | 'boleto' | 'credit_card';
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export type NewPayment = Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
