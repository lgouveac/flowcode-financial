
-- Alter email_notification_log table to add support for one-time payments
ALTER TABLE IF EXISTS email_notification_log 
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id),
ADD COLUMN IF NOT EXISTS payment_type TEXT;

-- Create index on payment_id for better performance
CREATE INDEX IF NOT EXISTS idx_email_notification_log_payment_id ON email_notification_log(payment_id);

-- Comment on new columns
COMMENT ON COLUMN email_notification_log.payment_id IS 'Reference to one-time payment ID if this is a payment notification';
COMMENT ON COLUMN email_notification_log.payment_type IS 'Type of payment (recurring or oneTime)';
