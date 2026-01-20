-- Create table for storing approved project hours
CREATE TABLE IF NOT EXISTS projects_approved_hours (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    project_id INTEGER NOT NULL,
    approved BOOLEAN DEFAULT FALSE,
    link_relatorio TEXT,
    project_hours JSONB,
    date_approval DATE
);

-- Add RLS policies
ALTER TABLE projects_approved_hours ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read all records
CREATE POLICY "Allow authenticated users to read approved hours"
    ON projects_approved_hours
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy to allow authenticated users to insert records
CREATE POLICY "Allow authenticated users to insert approved hours"
    ON projects_approved_hours
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy to allow authenticated users to update records
CREATE POLICY "Allow authenticated users to update approved hours"
    ON projects_approved_hours
    FOR UPDATE
    TO authenticated
    USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_approved_hours_project_id
    ON projects_approved_hours (project_id);

CREATE INDEX IF NOT EXISTS idx_projects_approved_hours_date_approval
    ON projects_approved_hours (date_approval);

CREATE INDEX IF NOT EXISTS idx_projects_approved_hours_approved
    ON projects_approved_hours (approved);