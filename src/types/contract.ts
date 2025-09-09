
export interface Contract {
  id: number;
  client_id?: string;
  employee_id?: string;
  contract_id?: string;
  scope?: string;
  total_value?: number;
  installments?: number;
  installment_value?: number;
  installment_value_text?: string;
  start_date?: string;
  end_date?: string;
  status?: "active" | "completed" | "cancelled" | "suspended";
  contract_type?: "open_scope" | "closed_scope" | "NDA";
  contractor_type?: "individual" | "legal_entity";
  data_de_assinatura?: string;
  signing_date_legacy?: string;
  link_contrato?: string;
  obs?: string;
  Horas?: string;
  // Assinatura Cliente
  ip?: string; // IP da assinatura do cliente
  signature_data?: string; // Dados da assinatura do cliente
  signed_at?: string; // Data da assinatura do cliente (pode usar este ou data_de_assinatura)
  
  // Assinatura FlowCode
  ip_flowcode?: string; // IP da assinatura da FlowCode
  assinante_flowcode?: string; // Nome do assinante FlowCode
  flowcode_signature_data?: string; // Dados da assinatura da FlowCode
  data_de_assinatura_flowcode?: string; // Data da assinatura da FlowCode
  created_at: string;
  updated_at?: string;
  clients?: {
    name: string;
    email: string;
    type: string;
  } | null;
  employees?: {
    name: string;
    email: string;
  } | null;
}

export type NewContract = Omit<Contract, 'id' | 'created_at' | 'updated_at'> & {
  total_value: number;
  installments: number;
  scope: string;
};

export type EditableContractFields = Pick<Contract, 'scope' | 'total_value' | 'installments' | 'start_date' | 'end_date' | 'status' | 'contract_type' | 'contractor_type' | 'data_de_assinatura' | 'link_contrato' | 'obs' | 'Horas'>;
