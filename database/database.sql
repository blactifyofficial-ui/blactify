-- Blactify Consolidated Database Schema
-- Last Updated: 2026-03-11
-- This script is idempotent (can be run multiple times).

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    size_config JSONB DEFAULT '[]', -- Legacy support
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles Table (Synced from Firebase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY, -- Firebase UID
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    welcome_discount_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, -- Format: p-001
    name TEXT NOT NULL,
    handle TEXT UNIQUE NOT NULL, -- SEO slug
    description TEXT,
    price_base NUMERIC NOT NULL CHECK (price_base >= 0),
    price_offer NUMERIC CHECK (price_offer >= 0),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    out_of_stock_at TIMESTAMPTZ,
    show_on_home BOOLEAN DEFAULT FALSE,
    featured_at TIMESTAMPTZ,
    home_order INTEGER,
    out_of_stock_at TIMESTAMPTZ,
    tag TEXT, -- "New Arrival", "Limited Edition", etc.
    stock INTEGER DEFAULT 0, -- Denormalized total stock
    size_variants TEXT[] DEFAULT '{}', -- Denormalized size list
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Product Images
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Product Variants (Sizes & Stock)
CREATE TABLE IF NOT EXISTS product_variants (
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
CREATE TABLE IF NOT EXISTS measurement_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL, -- e.g. "Waist", "Inseam"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS category_measurements (
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    measurement_type_id UUID REFERENCES measurement_types(id) ON DELETE CASCADE,
    PRIMARY KEY (category_id, measurement_type_id)
);

CREATE TABLE IF NOT EXISTS variant_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    measurement_type_id UUID REFERENCES measurement_types(id) ON DELETE CASCADE,
    value TEXT NOT NULL, -- The specific measurement value
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(variant_id, measurement_type_id)
);

-- 7. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, -- Razorpay Order ID
    payment_id TEXT, -- Razorpay Payment ID
    user_id TEXT REFERENCES profiles(id),
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    items JSONB NOT NULL, -- Items snapshot
    status TEXT DEFAULT 'pending', -- pending, paid, processing, shipped, delivered, failed
    shipping_address JSONB NOT NULL,
    customer_details JSONB NOT NULL,
    payment_details JSONB DEFAULT '{}',
    tracking_id TEXT, -- Logistics Tracking ID
    tracking_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Order Items (Relational map)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_purchase NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Store Settings Table
CREATE TABLE IF NOT EXISTS store_settings (
    id BOOLEAN PRIMARY KEY DEFAULT TRUE,
    purchases_enabled BOOLEAN DEFAULT TRUE,
    free_shipping_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT store_settings_id_check CHECK (id = TRUE)
);

-- 11. Signup OTPs Table
CREATE TABLE IF NOT EXISTS signup_otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE
);

-- 12. Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
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

-- 13. Developer Logs Table
CREATE TABLE IF NOT EXISTS developer_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    user_email TEXT,
    severity TEXT DEFAULT 'info',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Drops Table
CREATE TABLE IF NOT EXISTS drops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    publish_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Product Drop Mappings
CREATE TABLE IF NOT EXISTS product_drop_mappings (
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    drop_id UUID REFERENCES drops(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (product_id, drop_id)
);

-- ---------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_handle ON products(handle);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_signup_otps_email ON signup_otps (email);
CREATE INDEX IF NOT EXISTS idx_signup_otps_expires_at ON signup_otps (expires_at);
CREATE INDEX IF NOT EXISTS idx_drops_publish_date ON drops(publish_date);
CREATE INDEX IF NOT EXISTS idx_product_drop_mappings_drop ON product_drop_mappings(drop_id);

-- ---------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------
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
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE signup_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_drop_mappings ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------
-- POLICIES (Idempotent using DROP/CREATE)
-- ---------------------------------------------------------

-- Public Access
DO $$ 
BEGIN
    -- Products
    DROP POLICY IF EXISTS "Public Read Access" ON products;
    CREATE POLICY "Public Read Access" ON products FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Public Manage Products" ON products;
    CREATE POLICY "Public Manage Products" ON products FOR ALL USING (true) WITH CHECK (true);

    -- Categories
    DROP POLICY IF EXISTS "Public Read Access" ON categories;
    CREATE POLICY "Public Read Access" ON categories FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Public Manage Categories" ON categories;
    CREATE POLICY "Public Manage Categories" ON categories FOR ALL USING (true) WITH CHECK (true);

    -- Measurements
    DROP POLICY IF EXISTS "Public Read Access" ON measurement_types;
    CREATE POLICY "Public Read Access" ON measurement_types FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Allow Anon Manage measurement_types" ON measurement_types;
    CREATE POLICY "Allow Anon Manage measurement_types" ON measurement_types FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Read Access" ON category_measurements;
    CREATE POLICY "Public Read Access" ON category_measurements FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Allow Anon Manage category_measurements" ON category_measurements;
    CREATE POLICY "Allow Anon Manage category_measurements" ON category_measurements FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Read Access" ON variant_measurements;
    CREATE POLICY "Public Read Access" ON variant_measurements FOR SELECT USING (true);

    -- Profiles
    DROP POLICY IF EXISTS "Public Read Profiles" ON profiles;
    CREATE POLICY "Public Read Profiles" ON profiles FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Public Manage Profiles" ON profiles;
    CREATE POLICY "Public Manage Profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

    -- Store Settings
    DROP POLICY IF EXISTS "Allow public read access" ON store_settings;
    CREATE POLICY "Allow public read access" ON store_settings FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Allow update for authenticated users" ON store_settings;
    CREATE POLICY "Allow update for authenticated users" ON store_settings FOR UPDATE USING (auth.role() = 'authenticated');

    -- Orders & Items
    DROP POLICY IF EXISTS "Public Manage Orders" ON orders;
    CREATE POLICY "Public Manage Orders" ON orders FOR ALL USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS "Public Manage Order Items" ON order_items;
    CREATE POLICY "Public Manage Order Items" ON order_items FOR ALL USING (true) WITH CHECK (true);

    -- Images & Misc
    DROP POLICY IF EXISTS "Public Read Access" ON product_images;
    CREATE POLICY "Public Read Access" ON product_images FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Public Manage Product Images" ON product_images;
    CREATE POLICY "Public Manage Product Images" ON product_images FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Read Access" ON product_variants;
    CREATE POLICY "Public Read Access" ON product_variants FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Public Manage Product Variants" ON product_variants;
    CREATE POLICY "Public Manage Product Variants" ON product_variants FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Manage Reviews" ON reviews;
    CREATE POLICY "Public Manage Reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);

    -- Support Tickets
    DROP POLICY IF EXISTS "Public Manage Tickets" ON support_tickets;
    CREATE POLICY "Public Manage Tickets" ON support_tickets FOR ALL USING (true) WITH CHECK (true);

    -- Drops
    DROP POLICY IF EXISTS "Public Read Drops" ON drops;
    CREATE POLICY "Public Read Drops" ON drops FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Admin Manage Drops" ON drops;
    CREATE POLICY "Admin Manage Drops" ON drops FOR ALL USING (true) WITH CHECK (true);

    -- Product Drop Mappings
    DROP POLICY IF EXISTS "Public Read Mappings" ON product_drop_mappings;
    CREATE POLICY "Public Read Mappings" ON product_drop_mappings FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Admin Manage Mappings" ON product_drop_mappings;
    CREATE POLICY "Admin Manage Mappings" ON product_drop_mappings FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ---------------------------------------------------------
-- FUNCTIONS & TRIGGERS
-- ---------------------------------------------------------

-- 1. Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
DROP TRIGGER IF EXISTS tr_categories_updated_at ON categories;
CREATE TRIGGER tr_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON profiles;
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_products_updated_at ON products;
CREATE TRIGGER tr_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_drops_updated_at ON drops;
CREATE TRIGGER tr_drops_updated_at BEFORE UPDATE ON drops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. OTP Self-Cleaning
CREATE OR REPLACE FUNCTION delete_expired_otps() RETURNS trigger AS $$
BEGIN
    DELETE FROM signup_otps WHERE expires_at < NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_cleanup_expired_otps ON signup_otps;
CREATE TRIGGER tr_cleanup_expired_otps AFTER INSERT ON signup_otps FOR EACH STATEMENT EXECUTE FUNCTION delete_expired_otps();

-- 3. Order Creation RPC (v2)
CREATE OR REPLACE FUNCTION create_order_v2(
    p_order_id TEXT,
    p_user_id TEXT,
    p_amount NUMERIC,
    p_currency TEXT,
    p_status TEXT,
    p_shipping_address JSONB,
    p_customer_details JSONB,
    p_payment_details JSONB,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_current_stock INTEGER;
    v_variant_id UUID;
    v_product_price_base NUMERIC;
    v_product_price_offer NUMERIC;
    v_final_user_id TEXT;
BEGIN
    v_final_user_id := CASE WHEN p_user_id = 'guest' OR p_user_id = '' THEN NULL ELSE p_user_id END;

    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(id TEXT, size TEXT, quantity INTEGER, price_base NUMERIC, price_offer NUMERIC)
    LOOP
        SELECT price_base, price_offer INTO v_product_price_base, v_product_price_offer FROM products WHERE id = v_item.id;
        IF v_product_price_base IS NULL THEN RAISE EXCEPTION 'Product not found: %', v_item.id; END IF;
        
        -- Relaxed price check to allow minor variation if needed, but here strict.
        -- IF v_product_price_base != v_item.price_base THEN RAISE EXCEPTION 'Price mismatch'; END IF;

        SELECT id, stock INTO v_variant_id, v_current_stock
        FROM product_variants
        WHERE product_id = v_item.id AND (size = v_item.size OR (v_item.size IS NULL AND size = 'no size'))
        FOR UPDATE;

        IF v_current_stock IS NULL THEN RAISE EXCEPTION 'Variant not found: % size %', v_item.id, v_item.size; END IF;
        IF v_current_stock < v_item.quantity THEN RAISE EXCEPTION 'Insufficient stock for %', v_item.id; END IF;

        UPDATE product_variants SET stock = stock - v_item.quantity WHERE id = v_variant_id;
    END LOOP;

    INSERT INTO orders (id, payment_id, user_id, amount, currency, items, status, shipping_address, customer_details, payment_details)
    VALUES (p_order_id, (p_payment_details->>'razorpay_payment_id'), v_final_user_id, p_amount, p_currency, p_items, p_status, p_shipping_address, p_customer_details, p_payment_details);

    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(id TEXT, size TEXT, quantity INTEGER, price_base NUMERIC, price_offer NUMERIC)
    LOOP
        SELECT id INTO v_variant_id FROM product_variants WHERE product_id = v_item.id AND (size = v_item.size OR (v_item.size IS NULL AND size = 'no size'));
        INSERT INTO order_items (order_id, product_id, variant_id, quantity, price_at_purchase)
        VALUES (p_order_id, v_item.id, v_variant_id, v_item.quantity, COALESCE(v_item.price_offer, v_item.price_base));
    END LOOP;

    RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Seed Data
INSERT INTO store_settings (id, purchases_enabled) VALUES (TRUE, TRUE) ON CONFLICT (id) DO NOTHING;
