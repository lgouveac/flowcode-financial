-- Add project_id column to access_vault table
ALTER TABLE access_vault ADD COLUMN project_id INTEGER REFERENCES projetos(id) ON DELETE CASCADE;

-- Index for efficient project-based queries
CREATE INDEX idx_access_vault_project_id ON access_vault(project_id);
