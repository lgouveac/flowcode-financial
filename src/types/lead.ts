export interface Lead {
  id: number;
  Nome: string;
  Email?: string;
  Celular?: string;
  Valor?: number;
  Status: string; // Status_Lead enum - vou descobrir os valores possíveis
  created_at: string;
  won_at?: string;
  tempo_fechamento?: number; // Tempo em dias para fechar o lead (editável)
}

export type NewLead = Omit<Lead, 'id' | 'created_at' | 'won_at'> & {
  Nome: string;
  Email?: string;
  Status: string;
};

export type LeadStatus = string;

// Valores reais do enum Status_Lead
export const LEAD_STATUS_LABELS: Record<string, string> = {
  "Income": "Novo Lead",
  "Contact Made": "Contato Feito",
  "Proposal Sent": "Proposta Enviada",
  "Contract": "Contrato",
  "Future": "Futuro",
  "Won": "Ganho",
  "Lost": "Perdido"
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  "Income": "bg-blue-100 text-blue-800",
  "Contact Made": "bg-yellow-100 text-yellow-800",
  "Proposal Sent": "bg-purple-100 text-purple-800",
  "Contract": "bg-indigo-100 text-indigo-800",
  "Future": "bg-cyan-100 text-cyan-800",
  "Won": "bg-green-100 text-green-800",
  "Lost": "bg-red-100 text-red-800"
};