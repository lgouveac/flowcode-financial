
-- Update template validation function to accept 'contract' subtype
CREATE OR REPLACE FUNCTION validate_template_type_subtype()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'clients' AND NEW.subtype NOT IN ('recurring', 'oneTime', 'reminder', 'contract', 'novo_subtipo') THEN
    RAISE EXCEPTION 'Invalid subtype % for client templates. Must be one of: recurring, oneTime, reminder, contract, novo_subtipo', NEW.subtype;
  END IF;
  
  IF NEW.type = 'employees' AND NEW.subtype NOT IN ('invoice', 'hours', 'novo_subtipo') THEN
    RAISE EXCEPTION 'Invalid subtype % for employee templates. Must be one of: invoice, hours, novo_subtipo', NEW.subtype;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
