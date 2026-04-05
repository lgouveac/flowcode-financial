export interface Project {
  id: string;
  name: string;
  description?: string;
  prd?: string; // Product Requirements Document (rich text)
  client_id?: string;
  contract_id?: number;
  status: 'active' | 'paused' | 'completed';
  data_inicio_ciclo?: string;
  created_at: string;
  
  // Public task submission
  submit_token?: string;

  // GitHub fields
  github_repo_full_name?: string;
  github_repo_url?: string;
  github_sync_enabled?: boolean;
  github_last_sync_at?: string;

  // Relations
  clients?: {
    id: string;
    name: string;
  };
  contratos?: {
    id: number;
    scope?: string;
    total_value?: number;
  };
}

export interface ProjectAccess {
  id: string;
  project_id: number;
  user_id?: string;
  employee_id?: string;
  access_level: 'view' | 'edit' | 'admin';
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Relations
  user?: {
    id: string;
    full_name?: string;
    email?: string;
  };
  employee?: {
    id: string;
    name: string;
    email?: string;
  };
  created_by_user?: {
    id: string;
    full_name?: string;
  };
}

export type NewProjectAccess = Omit<ProjectAccess, 'id' | 'created_at' | 'updated_at' | 'user' | 'employee' | 'created_by_user'>;

export interface ProjectHour {
  id: string;
  project_id: string;
  employee_id: string;
  date_worked: string;
  hours_worked: number;
  description?: string;
  created_at: string;

  // Relations
  projetos?: Project;
  employees?: {
    id: string;
    name: string;
  };
}

export interface ProjectHourReport {
  project_id: string;
  project_name: string;
  client_id?: string;
  client_name?: string;
  employee_id: string;
  employee_name: string;
  date_worked: string;
  hours_worked: number;
  description?: string;
  month_year: string;
}

export type NewProject = Omit<Project, 'id' | 'created_at'>;
export type NewProjectHour = Omit<ProjectHour, 'id' | 'created_at' | 'projetos' | 'employees'>;