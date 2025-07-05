
-- Create global_settings table to store application-wide settings
CREATE TABLE public.global_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_emails_send_day integer DEFAULT 5,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create employee_email_settings table for email notification settings
CREATE TABLE public.employee_email_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_time time DEFAULT '09:00:00',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create email_cc_recipients table for managing CC recipients
CREATE TABLE public.email_cc_recipients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on all new tables
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_cc_recipients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow authenticated users to select global_settings" 
  ON public.global_settings 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to update global_settings" 
  ON public.global_settings 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow authenticated users to insert global_settings" 
  ON public.global_settings 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select employee_email_settings" 
  ON public.employee_email_settings 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to update employee_email_settings" 
  ON public.employee_email_settings 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow authenticated users to insert employee_email_settings" 
  ON public.employee_email_settings 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select email_cc_recipients" 
  ON public.email_cc_recipients 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to update email_cc_recipients" 
  ON public.email_cc_recipients 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow authenticated users to insert email_cc_recipients" 
  ON public.email_cc_recipients 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete email_cc_recipients" 
  ON public.email_cc_recipients 
  FOR DELETE 
  USING (true);

-- Insert default settings
INSERT INTO public.global_settings (employee_emails_send_day) VALUES (5);
INSERT INTO public.employee_email_settings (notification_time) VALUES ('09:00:00');
