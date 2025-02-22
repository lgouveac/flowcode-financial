
export interface CashFlow {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: string;
  payment_id?: string;
  created_at?: string;
  updated_at?: string;
}

export type NewCashFlow = Omit<CashFlow, 'id' | 'created_at' | 'updated_at'>;
