-- MIGRAÇÃO CORRIGIDA: Unificar recurring_billing e payments em uma única tabela
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Adicionar a coluna scope_type se não existir
ALTER TABLE payments ADD COLUMN IF NOT EXISTS scope_type VARCHAR(10);

-- PASSO 2: Inserir dados da recurring_billing na tabela payments como escopo aberto
INSERT INTO payments (
  client_id, description, amount, due_date, status, 
  payment_method, created_at, updated_at, scope_type,
  installments, current_installment
)
SELECT 
  client_id,
  description,
  amount,
  CASE 
    WHEN due_day IS NOT NULL THEN 
      DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + (due_day - 1) * INTERVAL '1 day'
    ELSE CURRENT_DATE + INTERVAL '30 days'
  END as due_date,
  status,
  payment_method,
  created_at,
  updated_at,
  'open' as scope_type,
  COALESCE(installments, 1) as installments,
  COALESCE(current_installment, 1) as current_installment
FROM recurring_billing
WHERE NOT EXISTS (
  SELECT 1 FROM payments p 
  WHERE p.client_id = recurring_billing.client_id 
  AND p.description = recurring_billing.description 
  AND p.scope_type = 'open'
);

-- PASSO 3: Marcar todos os payments existentes como escopo fechado (se ainda não têm scope_type)
UPDATE payments 
SET scope_type = 'closed' 
WHERE scope_type IS NULL;

-- PASSO 4: Tornar o campo obrigatório
ALTER TABLE payments ALTER COLUMN scope_type SET NOT NULL;
ALTER TABLE payments ALTER COLUMN scope_type SET DEFAULT 'closed';

-- PASSO 5: Adicionar colunas que podem estar faltando
ALTER TABLE payments ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS current_installment INTEGER DEFAULT 1;

-- PASSO 6: Criar índice
CREATE INDEX IF NOT EXISTS idx_payments_scope_type ON payments(scope_type);

-- VERIFICAÇÃO
SELECT scope_type, COUNT(*) as total FROM payments GROUP BY scope_type;

-- VERIFICAÇÃO: Mostrar alguns exemplos de cada escopo
SELECT client_id, description, scope_type, installments, current_installment
FROM payments 
ORDER BY scope_type, created_at 
LIMIT 10;