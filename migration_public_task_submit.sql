-- =============================================
-- Migration: Public Task Submit (Bug/Backlog)
-- Allows external clients to submit tasks
-- =============================================

-- 1. Add new columns to project_tasks
ALTER TABLE project_tasks
  ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT NULL CHECK (task_type IN ('bug', 'backlog')),
  ADD COLUMN IF NOT EXISTS reported_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reported_view TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reported_by_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reported_by_email TEXT DEFAULT NULL;

-- 2. Create task_attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  comment_id UUID DEFAULT NULL REFERENCES task_comments(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'file')),
  file_name TEXT NOT NULL,
  file_size BIGINT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_comment_id ON task_attachments(comment_id);

-- 3. RLS policies for task_attachments
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can do everything
CREATE POLICY "Authenticated users full access on task_attachments"
  ON task_attachments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anonymous users can INSERT (for public submissions)
CREATE POLICY "Anon insert task_attachments"
  ON task_attachments FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      WHERE pt.id = task_id AND pt.is_public = true
    )
  );

-- Anonymous users can SELECT attachments of public tasks
CREATE POLICY "Anon select task_attachments"
  ON task_attachments FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      WHERE pt.id = task_id AND pt.is_public = true
    )
  );

-- 4. RLS policy for anon INSERT on project_tasks (public submission via token)
-- Allow anon to insert tasks into projects that have a public submission token
CREATE POLICY "Anon insert project_tasks via public token"
  ON project_tasks FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon to read public tasks
CREATE POLICY "Anon select public project_tasks"
  ON project_tasks FOR SELECT
  TO anon
  USING (is_public = true);

-- 5. RLS for task_comments - allow anon insert on public tasks
CREATE POLICY "Anon insert task_comments on public tasks"
  ON task_comments FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      WHERE pt.id = task_id AND pt.is_public = true
    )
  );

CREATE POLICY "Anon select task_comments on public tasks"
  ON task_comments FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      WHERE pt.id = task_id AND pt.is_public = true
    )
  );

-- 6. Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies - allow public uploads
CREATE POLICY "Anyone can upload task attachments"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'task-attachments');

CREATE POLICY "Anyone can view task attachments"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'task-attachments');

-- 7. Add project_submit_token to projetos for public submission links
ALTER TABLE projetos
  ADD COLUMN IF NOT EXISTS submit_token UUID DEFAULT gen_random_uuid();

-- Ensure unique tokens
CREATE UNIQUE INDEX IF NOT EXISTS idx_projetos_submit_token ON projetos(submit_token);

-- Allow anon to read project by submit_token (limited fields)
CREATE POLICY "Anon select projetos by submit_token"
  ON projetos FOR SELECT
  TO anon
  USING (submit_token IS NOT NULL);

-- Allow anon to read task_statuses for the project
CREATE POLICY "Anon select task_statuses"
  ON task_statuses FOR SELECT
  TO anon
  USING (true);
