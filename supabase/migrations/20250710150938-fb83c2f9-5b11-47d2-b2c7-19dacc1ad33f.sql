-- Create ENUM types for better data integrity
CREATE TYPE contract_type AS ENUM ('open_scope', 'closed_scope');
CREATE TYPE contractor_type AS ENUM ('individual', 'legal_entity');

-- Add new columns to the Contratos table
ALTER TABLE "Contratos" 
ADD COLUMN contract_type contract_type DEFAULT 'closed_scope',
ADD COLUMN contractor_type contractor_type DEFAULT 'individual';