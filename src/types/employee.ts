
export interface EmployeeMonthlyValue {
  id: string;
  employee_id: string;
  due_date: string; // The database uses due_date instead of month
  due_data: number; // The database uses due_data instead of amount
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

export interface Employee {
  id: string;
  name: string;
  type: "fixed" | "freelancer";
  status: "active" | "inactive";
  payment_method: string;
  last_invoice?: string;
  cnpj?: string;
  pix?: string;
  address?: string;
  position?: string;
  phone?: string;
  email: string;
  preferred_template?: "invoice" | "hours" | "novo_subtipo";
}
