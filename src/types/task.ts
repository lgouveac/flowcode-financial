export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskStatus {
  id: string;
  project_id?: number; // null = status global
  name: string;
  color: string; // Hex color
  icon?: string; // Lucide icon name
  position: number;
  is_default: boolean;
  created_at: string;
}

export interface ProjectTask {
  id: string;
  name: string;
  description?: string; // Rich text content
  project_id: number;
  status_id: string;
  position: number;
  assigned_to?: string;
  due_date?: string;
  priority?: TaskPriority;
  is_public: boolean;
  public_token?: string; // Token para link público
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Relations
  project?: {
    id: number;
    name: string;
  };
  status?: TaskStatus;
  assigned_employee?: {
    id: string;
    name: string;
  };
  created_by_user?: {
    id: string;
    full_name?: string;
  };
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  task_id: string;
  content: string;
  is_public: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  created_by_user?: {
    id: string;
    full_name?: string;
  };
}

export type NewTaskStatus = Omit<TaskStatus, 'id' | 'created_at'>;
export type NewProjectTask = Omit<ProjectTask, 'id' | 'created_at' | 'updated_at' | 'public_token' | 'project' | 'status' | 'assigned_employee' | 'created_by_user' | 'comments'>;
export type NewTaskComment = Omit<TaskComment, 'id' | 'created_at' | 'updated_at' | 'created_by_user'>;




