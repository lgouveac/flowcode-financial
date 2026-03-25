export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskType = 'bug' | 'backlog';

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

export interface TaskAttachment {
  id: string;
  task_id: string;
  comment_id?: string;
  file_url: string;
  file_type: 'image' | 'video' | 'file';
  file_name: string;
  file_size?: number;
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

  // Public submission fields
  task_type?: TaskType;
  reported_url?: string;
  reported_view?: string;
  reported_by_name?: string;
  reported_by_email?: string;

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
  attachments?: TaskAttachment[];
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
  attachments?: TaskAttachment[];
}

export type NewTaskStatus = Omit<TaskStatus, 'id' | 'created_at'>;
export type NewProjectTask = Omit<ProjectTask, 'id' | 'created_at' | 'updated_at' | 'public_token' | 'project' | 'status' | 'assigned_employee' | 'created_by_user' | 'comments' | 'attachments'>;
export type NewTaskComment = Omit<TaskComment, 'id' | 'created_at' | 'updated_at' | 'created_by_user' | 'attachments'>;
export type NewTaskAttachment = Omit<TaskAttachment, 'id' | 'created_at'>;




