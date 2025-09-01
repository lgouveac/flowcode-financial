-- MIGRATION: Adicionar scope_type na tabela payments
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Adicionar a coluna scope_type
ALTER TABLE payments ADD COLUMN scope_type VARCHAR(10);

-- PASSO 2: Preencher com base nos dados existentes
-- Pagamentos que começam com "recurring-" são do escopo aberto
UPDATE payments 
SET scope_type = 'open' 
WHERE id::text LIKE 'recurring-%';

-- Todos os outros são do escopo fechado
UPDATE payments 
SET scope_type = 'closed' 
WHERE scope_type IS NULL;

-- PASSO 3: Tornar o campo obrigatório e definir default
ALTER TABLE payments ALTER COLUMN scope_type SET NOT NULL;
ALTER TABLE payments ALTER COLUMN scope_type SET DEFAULT 'closed';

-- PASSO 4: Criar índice para performance
CREATE INDEX idx_payments_scope_type ON payments(scope_type);

-- VERIFICAÇÃO: Contar registros por scope_type
SELECT scope_type, COUNT(*) as total 
FROM payments 
GROUP BY scope_type;

-- VERIFICAÇÃO: Mostrar alguns exemplos
SELECT id, client_id, description, scope_type 
FROM payments 
ORDER BY scope_type, created_at 
LIMIT 10;