-- Adicionar campo won_at na tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS won_at TIMESTAMP WITH TIME ZONE;

-- Comentário sobre o campo
COMMENT ON COLUMN leads.won_at IS 'Data e hora em que o lead foi marcado como ganho (Won)';