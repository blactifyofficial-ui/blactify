-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin Manage measurement_types" ON measurement_types;
DROP POLICY IF EXISTS "Admin Manage category_measurements" ON category_measurements;

-- Add new permissive policies for development/admin use without Supabase Auth
CREATE POLICY "Allow Anon Manage measurement_types" ON measurement_types 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow Anon Manage category_measurements" ON category_measurements 
    FOR ALL USING (true) WITH CHECK (true);
