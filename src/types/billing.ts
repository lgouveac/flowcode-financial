
export interface RecurringBilling {
  id: string;
  client_id: string;
  description: string;
  amount: number;
  due_day: number;
  status: 'pending' | 'billed' | 'awaiting_invoice' | 'paid' | 'overdue' | 'cancelled';
  payment_method: 'pix' | 'boleto' | 'credit_card';
  start_date: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

export type NewRecurringBilling = Omit<RecurringBilling, 'id' | 'created_at' | 'updated_at'>;

