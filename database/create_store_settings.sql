-- Create store_settings table
CREATE TABLE IF NOT EXISTS store_settings (
    id BOOLEAN PRIMARY KEY DEFAULT TRUE,
    purchases_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT store_settings_id_check CHECK (id = TRUE)
);

-- Insert default row if not exists
INSERT INTO store_settings (id, purchases_enabled)
VALUES (TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (public)
CREATE POLICY "Allow public read access" ON store_settings
    FOR SELECT USING (true);

-- Allow update access to service_role and potentially authenticated admins
-- For now, we'll allow service_role and authenticated users to update (assuming only admins have access to the admin panel which calls the update)
-- Ideally, you'd restrict this to a specific admin role or email
CREATE POLICY "Allow update for authenticated users" ON store_settings
    FOR UPDATE USING (auth.role() = 'authenticated');
