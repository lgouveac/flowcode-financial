
-- First make sure we have the unpaid status in the enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_status' AND
                 'unpaid' = ANY(enum_range(NULL::client_status)::text[])) THEN
    ALTER TYPE client_status ADD VALUE 'unpaid';
  END IF;
END $$;

-- Create a function to update client status to unpaid based on overdue payments
CREATE OR REPLACE FUNCTION update_unpaid_clients()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  clients_updated INT := 0;
BEGIN
  -- Update clients with overdue payments to 'unpaid' status
  WITH overdue_clients AS (
    SELECT DISTINCT c.id
    FROM clients c
    JOIN payments p ON c.id = p.client_id
    WHERE p.status = 'pending'
    AND p.due_date < CURRENT_DATE
  )
  UPDATE clients c
  SET 
    status = 'unpaid',
    updated_at = NOW()
  FROM overdue_clients oc
  WHERE c.id = oc.id
  AND c.status != 'unpaid';
  
  GET DIAGNOSTICS clients_updated = ROW_COUNT;
  
  RAISE LOG 'Updated % clients to unpaid status', clients_updated;
END;
$$;

-- Create a daily cron job to update unpaid clients
SELECT cron.schedule(
  'update-unpaid-clients',
  '0 0 * * *', -- Run at midnight every day
  'SELECT update_unpaid_clients()'
);

-- Add a trigger to update client status when payments change
CREATE OR REPLACE FUNCTION update_client_status_on_payment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If a payment is marked as paid, check if the client has any other overdue payments
  IF NEW.status = 'paid' AND OLD.status = 'pending' THEN
    -- If no other overdue payments exist, update client status to active
    IF NOT EXISTS (
      SELECT 1 FROM payments
      WHERE client_id = NEW.client_id
      AND status = 'pending'
      AND due_date < CURRENT_DATE
    ) THEN
      UPDATE clients
      SET status = 'active', updated_at = NOW()
      WHERE id = NEW.client_id AND status = 'unpaid';
    END IF;
  END IF;
  
  -- If a payment becomes overdue, update client status to unpaid
  IF NEW.status = 'pending' AND NEW.due_date < CURRENT_DATE AND 
     (OLD.due_date >= CURRENT_DATE OR OLD.due_date IS NULL) THEN
    UPDATE clients
    SET status = 'unpaid', updated_at = NOW()
    WHERE id = NEW.client_id AND status != 'unpaid';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS payment_update_client_status ON payments;
CREATE TRIGGER payment_update_client_status
AFTER UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_client_status_on_payment_change();

-- Run the function once to update all clients with overdue payments
SELECT update_unpaid_clients();
