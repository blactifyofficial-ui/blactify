-- Create a variant_measurements table to store measurement values for each variant
CREATE TABLE IF NOT EXISTS variant_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    measurement_type_id UUID REFERENCES measurement_types(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(variant_id, measurement_type_id)
);

-- Enable RLS
ALTER TABLE variant_measurements ENABLE ROW LEVEL SECURITY;

-- Add permissive policy for development/admin use
CREATE POLICY "Allow Anon Manage variant_measurements" ON variant_measurements 
    FOR ALL USING (true) WITH CHECK (true);
