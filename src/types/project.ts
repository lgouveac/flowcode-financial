export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id?: string;
  contract_id?: number;
  status: 'active' | 'paused' | 'completed';
  created_at: string;

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