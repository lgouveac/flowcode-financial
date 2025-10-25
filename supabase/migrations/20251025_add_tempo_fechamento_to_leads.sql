-- Add tempo_fechamento column to leads table
ALTER TABLE leads
ADD COLUMN tempo_fechamento integer;

-- Add comment to explain the column
COMMENT ON COLUMN leads.tempo_fechamento IS 'Tempo em dias para fechar o lead (preenchido manualmente)';