
-- First, let's check if there are any orphaned records and clean them up
DELETE FROM "Contratos" 
WHERE client_id IS NOT NULL 
AND client_id NOT IN (SELECT id FROM clients);

-- Add the foreign key constraint
ALTER TABLE "Contratos" 
ADD CONSTRAINT "Contratos_client_id_fkey" 
FOREIGN KEY (client_id) 
REFERENCES clients(id) 
ON DELETE SET NULL;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_contratos_client_id ON "Contratos"(client_id);
