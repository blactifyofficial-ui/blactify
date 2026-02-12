-- Run these commands in your Supabase SQL Editor to fix the "Row-Level Security" error.
-- This will allow your admin panel (using the anon key) to manage your products and categories.

-- Option 1: Disable RLS completely (Quickest fix for Admin panels protected by Firebase)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Option 2: Keep RLS enabled but allow all operations for the 'anon' role
-- (Only use if you plan to implement more complex Supabase Auth later)
/*
CREATE POLICY "Allow all for anon" ON products FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON categories FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON profiles FOR ALL TO anon USING (true) WITH CHECK (true);
*/
