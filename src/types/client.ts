
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "inactive" | "overdue";
  total_billing: number;
  last_payment?: string;
  type: "pf" | "pj";
  company_name?: string;
  cnpj?: string;
  partner_name?: string;
  partner_cpf?: string;
  cpf?: string;
  address: string;
  due_date: string;
  payment_method: "pix" | "boleto" | "credit_card";
  responsible_name?: string; // New field for the person responsible
}

// New type for creating a client - includes only the required fields
export type NewClient = Omit<Client, 'id' | 'total_billing' | 'status'> & {
  total_billing?: number;
  status?: "active" | "inactive" | "overdue";
};
