-- Adicionar colunas faltantes na tabela payments para unificação completa
-- Execute este script no Supabase SQL Editor

-- Adicionar colunas que existiam no recurring_billing mas não no payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS current_installment INTEGER DEFAULT 1;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS due_day INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS end_date DATE;

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;