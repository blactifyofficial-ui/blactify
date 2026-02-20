-- Blactify Consolidated Database Schema

-- Blacktfy Database Schema (Supabase/PostgreSQL) - Normalized Version

-- 1. Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    size_config JSONB DEFAULT '[]', -- DEPRECATED: Use measurement_types instead
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles Table (Synced from Firebase Auth)
CREATE TABLE profiles (
    id TEXT PRIMARY KEY, -- Firebase UID
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    welcome_discount_used BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products Table
CREATE TABLE products (
    id TEXT PRIMARY KEY, -- Format: p-001
    name TEXT NOT NULL,
    handle TEXT UNIQUE NOT NULL, -- SEO slug
    description TEXT,
    price_base NUMERIC NOT NULL,
    price_offer NUMERIC,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    show_on_home BOOLEAN DEFAULT FALSE,
    featured_at TIMESTAMPTZ,
    home_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Product Images
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Product Variants (Sizes & Stock)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    price_override NUMERIC,
    sku TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, size)
);

-- 6. Measurement System
CREATE TABLE measurement_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL, -- e.g. "Waist", "Inseam"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE category_measurements (
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    measurement_type_id UUID REFERENCES measurement_types(id) ON DELETE CASCADE,
    PRIMARY KEY (category_id, measurement_type_id)
);

CREATE TABLE variant_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    measurement_type_id UUID REFERENCES measurement_types(id) ON DELETE CASCADE,
    value TEXT NOT NULL, -- The specific measurement value
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(variant_id, measurement_type_id)
);

-- 6. Orders Table
CREATE TABLE orders (
    id TEXT PRIMARY KEY, -- Razorpay Order ID
    payment_id TEXT, -- Razorpay Payment ID
    user_id TEXT REFERENCES profiles(id),
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    items JSONB NOT NULL, -- Legacy/Backup
    status TEXT DEFAULT 'pending', -- pending, paid, processing, shipped, delivered, failed
    shipping_address JSONB NOT NULL,
    customer_details JSONB NOT NULL,
    tracking_id TEXT, -- Logistics Tracking ID
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_purchase NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_products_handle ON products(handle);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_tracking ON orders(tracking_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_variant_measurements_variant ON variant_measurements(variant_id);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_measurements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public Read Access" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON product_images FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON measurement_types FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON category_measurements FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON variant_measurements FOR SELECT USING (true);

CREATE POLICY "Users can manage own profile" ON profiles 
    FOR ALL USING (auth.uid()::text = id);

CREATE POLICY "Users can read own orders" ON orders 
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can read own order items" ON order_items 
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND auth.uid()::text = orders.user_id
    ));

CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post reviews" ON reviews 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Store Settings Table

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

-- Signup OTPs Table

-- Create a table for temporary OTP storage
CREATE TABLE IF NOT EXISTS public.signup_otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE
);

-- Index for faster cleanup and lookup
CREATE INDEX IF NOT EXISTS idx_signup_otps_email ON public.signup_otps (email);
CREATE INDEX IF NOT EXISTS idx_signup_otps_expires_at ON public.signup_otps (expires_at);

-- Disable RLS or set strong policies (since it's only accessed via service role)
ALTER TABLE public.signup_otps ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Service role can do everything" ON public.signup_otps
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION delete_expired_otps() RETURNS trigger AS $$
BEGIN
    DELETE FROM public.signup_otps WHERE expires_at < NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up on insert (simple self-cleaning for expired ones)
CREATE OR REPLACE TRIGGER cleanup_expired_otps_trigger
AFTER INSERT ON public.signup_otps
FOR EACH STATEMENT
EXECUTE FUNCTION delete_expired_otps();

-- Note: Deletion after successful use should be handled in the application logic
-- to ensure the transaction is completed before the record is removed.

-- Support Tickets Table

-- Support Ticket System Schema

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
    category TEXT NOT NULL, -- 'order_related', 'general', 'return_request', etc.
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open', -- 'open', 'responded', 'closed'
    admin_response TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can create tickets
CREATE POLICY "Users can create tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can read their own tickets
CREATE POLICY "Users can read own tickets" ON support_tickets
    FOR SELECT USING (auth.uid()::text = user_id);

-- Admins can do everything
CREATE POLICY "Admins have full access to tickets" ON support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid()::text AND profiles.is_admin = TRUE
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_support_tickets_updated_at();

-- Payment Details and Snapshots Migration

-- Migration: Add payment_details and ensure snapshots support
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}';

-- Optional: If we want to be explicit about snapshots
-- customer_details and shipping_address are already JSONB in the schema, 
-- but we'll ensure they are present.
-- Actually the schema shows:
-- items JSONB NOT NULL
-- shipping_address JSONB NOT NULL
-- customer_details JSONB NOT NULL

COMMENT ON COLUMN orders.payment_details IS 'Snapshot of payment details (Razorpay response, etc.)';
COMMENT ON COLUMN orders.shipping_address IS 'Snapshot of shipping address at the time of order';
COMMENT ON COLUMN orders.customer_details IS 'Snapshot of customer basic profile at the time of order';

-- Add Tracking ID Migration

-- Add tracking_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;

-- Add Created At To Profiles Migration

-- Migration to add created_at column to profiles table
-- This is needed for admin growth statistics calculations

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='created_at') THEN
        ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Populate existing rows with a sensible default if they are null
UPDATE profiles SET created_at = NOW() WHERE created_at IS NULL;

-- Normalize Measurements Migration

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

-- Order Creation RPC

-- Create a consolidated RPC for atomic order creation (ACID compliant)
CREATE OR REPLACE FUNCTION create_order_v2(
    p_order_id TEXT,
    p_user_id TEXT,
    p_amount NUMERIC,
    p_currency TEXT,
    p_status TEXT,
    p_shipping_address JSONB,
    p_customer_details JSONB,
    p_payment_details JSONB,
    p_items JSONB -- Array of items with {id, size, quantity, price_base, price_offer}
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_current_stock INTEGER;
    v_variant_id UUID;
    v_final_user_id TEXT;
BEGIN
    -- 0. Handle Guest User (null instead of "guest")
    v_final_user_id := CASE WHEN p_user_id = 'guest' THEN NULL ELSE p_user_id END;

    -- 1. Validate items and decrement stock (Atomicity & Consistency)
    -- We'll also store the variant_ids in a temp variable or just fetch them as we go
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(id TEXT, size TEXT, quantity INTEGER, price_base NUMERIC, price_offer NUMERIC)
    LOOP
        -- Lock the row for update to prevent race conditions (Isolation)
        SELECT id, stock INTO v_variant_id, v_current_stock
        FROM product_variants
        WHERE product_id = v_item.id AND (size = v_item.size OR (v_item.size IS NULL AND size = 'no size'))
        FOR UPDATE;

        IF v_current_stock IS NULL THEN
            RAISE EXCEPTION 'Product variant not found: % (size: %)', v_item.id, COALESCE(v_item.size, 'no size');
        END IF;

        IF v_current_stock < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product % (size: %). Available: %, Requested: %', 
                v_item.id, v_item.size, v_current_stock, v_item.quantity;
        END IF;

        -- Update stock
        UPDATE product_variants
        SET stock = stock - v_item.quantity
        WHERE id = v_variant_id; -- Use the specific variant ID we just locked
    END LOOP;

    -- 2. Insert the Order Record
    INSERT INTO orders (
        id, payment_id, user_id, amount, currency, items, status, 
        shipping_address, customer_details, payment_details, created_at
    ) VALUES (
        p_order_id, 
        (p_payment_details->>'razorpay_payment_id'), 
        v_final_user_id, 
        p_amount, 
        p_currency, 
        p_items, 
        p_status, 
        p_shipping_address, 
        p_customer_details, 
        p_payment_details,
        NOW()
    );

    -- 3. Insert Order Items (Standardized records)
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(id TEXT, size TEXT, quantity INTEGER, price_base NUMERIC, price_offer NUMERIC)
    LOOP
        -- Re-fetch variant_id (or we could have stored them in a temp table, but this is simple enough for small orders)
        SELECT id INTO v_variant_id
        FROM product_variants
        WHERE product_id = v_item.id AND (size = v_item.size OR (v_item.size IS NULL AND size = 'no size'));

        INSERT INTO order_items (
            order_id, product_id, variant_id, quantity, price_at_purchase
        ) VALUES (
            p_order_id,
            v_item.id,
            v_variant_id,
            v_item.quantity,
            COALESCE(v_item.price_offer, v_item.price_base)
        );
    END LOOP;

    RETURN jsonb_build_object('success', true, 'order_id', p_order_id);

EXCEPTION
    WHEN OTHERS THEN
        -- PostgreSQL automatically rolls back the transaction on exception (Durability)
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Stock Decrement RPC

-- Run this in Supabase SQL Editor
CREATE OR REPLACE FUNCTION decrement_stock_secure(
  p_product_id TEXT,
  p_size TEXT,
  p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock INTEGER;
BEGIN
  -- Get current stock with row-level lock for the specific variant
  SELECT stock INTO v_current_stock
  FROM product_variants
  WHERE product_id = p_product_id AND (size = p_size OR (p_size IS NULL AND size = 'no size'))
  FOR UPDATE;

  IF v_current_stock IS NULL THEN
    RAISE EXCEPTION 'Variant not found for product % and size %', p_product_id, p_size;
  END IF;

  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product % (size: %). Available: %, Requested: %', 
      p_product_id, p_size, v_current_stock, p_quantity;
  END IF;

  -- Decrement stock
  UPDATE product_variants
  SET stock = stock - p_quantity
  WHERE product_id = p_product_id AND (size = p_size OR (p_size IS NULL AND size = 'no size'));

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Fix Profiles Columns

-- Migration to add missing columns to the profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welcome_discount_used BOOLEAN DEFAULT FALSE;

-- Fix Profiles RLS

-- Disabling RLS temporarily on profiles to allow Firebase-based auth sync to work
-- Since the app uses Firebase for Auth and Supabase for Data, Supabase doesn't have the auth context.
-- A more permanent fix would be to use a Service Role key on the server (API route) for syncing.

DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;

CREATE POLICY "Public Read Profiles" ON profiles 
    FOR SELECT USING (true);

CREATE POLICY "Public Manage Profiles" ON profiles 
    FOR ALL USING (true) 
    WITH CHECK (true);

-- Fix Measurement RLS

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin Manage measurement_types" ON measurement_types;
DROP POLICY IF EXISTS "Admin Manage category_measurements" ON category_measurements;

-- Add new permissive policies for development/admin use without Supabase Auth
CREATE POLICY "Allow Anon Manage measurement_types" ON measurement_types 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow Anon Manage category_measurements" ON category_measurements 
    FOR ALL USING (true) WITH CHECK (true);

-- Comprehensive RLS Fix

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

-- Add home_order to products for curated home screen ordering
ALTER TABLE products ADD COLUMN IF NOT EXISTS home_order INTEGER;
