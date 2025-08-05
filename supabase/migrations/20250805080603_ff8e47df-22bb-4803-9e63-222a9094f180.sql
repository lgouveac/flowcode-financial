-- Add trade_name column to clients table for "Nome Fantasia"
ALTER TABLE public.clients 
ADD COLUMN trade_name TEXT;