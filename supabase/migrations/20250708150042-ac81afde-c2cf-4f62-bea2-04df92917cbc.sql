-- Remove the trigger that creates automatic cash flow entries to prevent duplicates
-- The syncPaidPaymentsWithCashFlow function will handle this instead
DROP TRIGGER IF EXISTS trigger_insert_into_cash_flow ON payments;

-- Clean up existing duplicate cash flow entries
-- Keep only the oldest entry for each unique payment_id
WITH ranked_entries AS (
  SELECT 
    id,
    payment_id,
    ROW_NUMBER() OVER (PARTITION BY payment_id ORDER BY created_at ASC) as rn
  FROM cash_flow 
  WHERE payment_id IS NOT NULL
),
duplicates_to_delete AS (
  SELECT id 
  FROM ranked_entries 
  WHERE rn > 1
)
DELETE FROM cash_flow 
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Create a unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_flow_payment_id_unique 
ON cash_flow (payment_id) 
WHERE payment_id IS NOT NULL;