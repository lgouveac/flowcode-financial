-- Create access_vault table for storing project credentials
CREATE TABLE IF NOT EXISTS access_vault (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    url TEXT,
    username TEXT,
    password TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE access_vault ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Allow authenticated users to select access_vault"
    ON access_vault FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert access_vault"
    ON access_vault FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update access_vault"
    ON access_vault FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete access_vault"
    ON access_vault FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_access_vault_category ON access_vault(category);
CREATE INDEX idx_access_vault_service_name ON access_vault(service_name);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_access_vault_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_access_vault_updated_at
    BEFORE UPDATE ON access_vault
    FOR EACH ROW EXECUTE FUNCTION update_access_vault_updated_at();
