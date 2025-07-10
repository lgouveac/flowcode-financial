
export interface Contract {
  id: number;
  client_id: string;
  contract_id?: string;
  scope?: string;
  total_value?: number;
  installments?: number;
  installment_value?: number;
  installment_value_text?: string;
  start_date?: string;
  end_date?: string;
  status?: "active" | "completed" | "cancelled" | "suspended";
  contract_type?: "open_scope" | "closed_scope";
  contractor_type?: "individual" | "legal_entity";
  data_de_assinatura?: string;
  signing_date_legacy?: string;
  link_contrato?: string;
  obs?: string;
  ip?: string;
  created_at: string;
  updated_at?: string;
  clients?: {
    name: string;
    email: string;
    type: string;
  } | null;
}

export type NewContract = Omit<Contract, 'id' | 'created_at' | 'updated_at'> & {
  total_value: number;
  installments: number;
  scope: string;
};

export type EditableContractFields = Pick<Contract, 'scope' | 'total_value' | 'installments' | 'start_date' | 'end_date' | 'status' | 'contract_type' | 'contractor_type' | 'data_de_assinatura' | 'link_contrato' | 'obs'>;
