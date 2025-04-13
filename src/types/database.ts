
export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "overdue" | "unpaid";
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
  responsible_name?: string;
}
