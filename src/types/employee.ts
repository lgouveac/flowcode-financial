
export interface EmployeeMonthlyValue {
  id: string;
  employee_id: string;
  month: string;
  amount: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EstimatedExpense {
  id?: string;
  name: string;
  amount: number;
  category: string;
  is_recurring: boolean;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}
