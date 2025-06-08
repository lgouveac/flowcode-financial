
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
  data_de_assinatura?: string;
  signing_date_legacy?: string;
  link_contrato?: string;
  obs?: string;
  ip?: string;
  created_at: string;
  updated_at?: string;
}

export type NewContract = Omit<Contract, 'id' | 'created_at' | 'updated_at'> & {
  total_value: number;
  installments: number;
  scope: string;
};

export type EditableContractFields = Pick<Contract, 'scope' | 'total_value' | 'installments' | 'start_date' | 'end_date' | 'status' | 'link_contrato' | 'obs'>;
