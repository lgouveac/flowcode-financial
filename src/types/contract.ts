
export interface Contract {
  id: number;
  client_id?: string;
  contract_id?: string;
  scope?: string;
  projeto_relacionado?: string;
  total_value?: number | string;
  installments?: number;
  installment_value?: number;
  installment_value_text?: string;
  start_date?: string;
  end_date?: string;
  status?: "active" | "completed" | "cancelled" | "suspended";
  contract_type?: "open_scope" | "closed_scope" | "NDA";
  contractor_type?: "individual" | "legal_entity";
  data_de_assinatura?: string;
  link_contrato?: string;
  link_contrato_externo?: string;
  contrato_externo?: string;
  obs?: string;
  Horas?: string;
  texto_contrato?: string;
  versao_atual?: string;
  // Assinatura Cliente
  ip?: string;
  // Assinatura FlowCode
  ip_flowcode?: string;
  assinante_flowcode?: string;
  data_assinatura_flowcode?: string;
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

export type EditableContractFields = Pick<Contract, 'scope' | 'total_value' | 'installments' | 'installment_value_text' | 'start_date' | 'end_date' | 'status' | 'contract_type' | 'contractor_type' | 'data_de_assinatura' | 'link_contrato' | 'link_contrato_externo' | 'obs' | 'Horas'>;
