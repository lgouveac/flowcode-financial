export interface AccessVaultEntry {
  id: string;
  service_name: string;
  category: AccessVaultCategory;
  project_id?: number;
  url?: string;
  username?: string;
  password?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type NewAccessVaultEntry = Omit<AccessVaultEntry, 'id' | 'created_at' | 'updated_at'>;

export type AccessVaultCategory = 'hosting' | 'database' | 'api' | 'email' | 'domain' | 'payment' | 'other';

export const ACCESS_VAULT_CATEGORY_LABELS: Record<AccessVaultCategory, string> = {
  hosting: "Hospedagem",
  database: "Banco de Dados",
  api: "API",
  email: "E-mail",
  domain: "Domínio",
  payment: "Pagamento",
  other: "Outro",
};

export const ACCESS_VAULT_CATEGORY_COLORS: Record<AccessVaultCategory, string> = {
  hosting: "bg-blue-100 text-blue-800",
  database: "bg-green-100 text-green-800",
  api: "bg-purple-100 text-purple-800",
  email: "bg-yellow-100 text-yellow-800",
  domain: "bg-indigo-100 text-indigo-800",
  payment: "bg-orange-100 text-orange-800",
  other: "bg-gray-100 text-gray-800",
};
