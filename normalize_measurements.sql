-- Migration: Normalize Category Measurement Fields
-- 1. Create measurement_types table
CREATE TABLE IF NOT EXISTS measurement_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create category_measurements junction table
CREATE TABLE IF NOT EXISTS category_measurements (
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    measurement_type_id UUID REFERENCES measurement_types(id) ON DELETE CASCADE,
    PRIMARY KEY (category_id, measurement_type_id)
);

-- 3. Enable RLS
ALTER TABLE measurement_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_measurements ENABLE ROW LEVEL SECURITY;

-- 4. Add Policies
CREATE POLICY "Public Read Access" ON measurement_types FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON category_measurements FOR SELECT USING (true);
-- Allow management by anonymous/admin users
CREATE POLICY "Allow Anon Manage measurement_types" ON measurement_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Anon Manage category_measurements" ON category_measurements FOR ALL USING (true) WITH CHECK (true);


-- 5. Migrate Data from categories.size_config (JSONB)
-- Insert unique measurement names
INSERT INTO measurement_types (name)
SELECT DISTINCT jsonb_array_elements_text(size_config)
FROM categories
WHERE size_config IS NOT NULL AND jsonb_array_length(size_config) > 0
ON CONFLICT (name) DO NOTHING;

-- Link categories to measurements
INSERT INTO category_measurements (category_id, measurement_type_id)
SELECT 
    c.id, 
    m.id
FROM categories c
CROSS JOIN LATERAL jsonb_array_elements_text(c.size_config) as field_name
JOIN measurement_types m ON m.name = field_name
ON CONFLICT DO NOTHING;

-- 6. Drop the old column (Optional: Comment out if you want to keep for backup, but for strict normalization we drop)
-- ALTER TABLE categories DROP COLUMN size_config;
