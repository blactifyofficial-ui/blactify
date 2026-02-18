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
