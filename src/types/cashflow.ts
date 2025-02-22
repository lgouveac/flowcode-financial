
export interface CashFlow {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: string;
  payment_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
}

export type NewCashFlow = Omit<CashFlow, 'id' | 'created_at' | 'updated_at'>;

// Helper function to ensure type safety when converting database string to union type
export function validateCashFlowType(type: string): 'income' | 'expense' {
  if (type !== 'income' && type !== 'expense') {
    throw new Error('Invalid cash flow type');
  }
  return type;
}

