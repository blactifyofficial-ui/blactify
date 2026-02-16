-- Comprehensive RLS fix for Firebase + Supabase architecture
-- Since we use Firebase Auth, Supabase's auth.uid() is always null.
-- We must allow public access or use a different mechanism.
-- These policies allow the application to function with Firebase Auth.

-- 1. Profiles
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
CREATE POLICY "Public Read Profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public Manage Profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- 2. Orders
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
CREATE POLICY "Public Manage Orders" ON orders FOR ALL USING (true) WITH CHECK (true);

-- 3. Order Items
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
CREATE POLICY "Public Manage Order Items" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- 4. Ensure other tables are also accessible
DROP POLICY IF EXISTS "Public Read Access" ON products;
CREATE POLICY "Public Manage Products" ON products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Access" ON categories;
CREATE POLICY "Public Manage Categories" ON categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Access" ON product_images;
CREATE POLICY "Public Manage Product Images" ON product_images FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Access" ON product_variants;
CREATE POLICY "Public Manage Product Variants" ON product_variants FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can post reviews" ON reviews;
CREATE POLICY "Public Manage Reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);
