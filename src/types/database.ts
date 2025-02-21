
export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "overdue";
  total_billing: number;
  last_payment?: string;
  type: "pf" | "pj";
  // Campos PJ
  company_name?: string;
  cnpj?: string;
  partner_name?: string;
  partner_cpf?: string;
  // Campos PF
  cpf?: string;
  // Campos comuns
  address: string;
  due_date: string;
  payment_method: "pix" | "boleto" | "credit_card";
  created_at?: string;
  updated_at?: string;
}

export type Employee = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  cnpj?: string;
  pix: string;
  type: "fixed" | "freelancer";
  status: "active" | "inactive";
  payment_method: string;
  last_invoice?: string;
  created_at?: string;
  updated_at?: string;
}

