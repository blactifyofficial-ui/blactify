-- Blacktfy Database Schema (Supabase/PostgreSQL)
-- Reconstructed from application source code

-- 1. Categories Table
CREATE TABLE categories (
    id TEXT PRIMARY KEY, -- Slugified name (e.g., 'accessories')
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles Table (Synced from Firebase Auth)
CREATE TABLE profiles (
    id TEXT PRIMARY KEY, -- Firebase UID
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
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
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    stock INTEGER DEFAULT 0,
    main_image TEXT NOT NULL,
    image1 TEXT,
    image2 TEXT,
    image3 TEXT,
    size_variants TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders Table
CREATE TABLE orders (
    id TEXT PRIMARY KEY, -- Razorpay Order ID
    payment_id TEXT, -- Razorpay Payment ID
    user_id TEXT REFERENCES profiles(id),
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    items JSONB NOT NULL, -- Array of product details at time of purchase
    status TEXT DEFAULT 'pending', -- pending, paid, processing, shipped, delivered, failed
    shipping_address JSONB NOT NULL,
    customer_details JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Reviews Table
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
CREATE INDEX idx_reviews_product ON reviews(product_id);

-- Row Level Security (RLS) - Inferred Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Products/Categories: Publicly Readable
CREATE POLICY "Public Read Access" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON categories FOR SELECT USING (true);

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can manage own profile" ON profiles 
    FOR ALL USING (auth.uid() = id);

-- Orders: Users can read their own orders
CREATE POLICY "Users can read own orders" ON orders 
    FOR SELECT USING (auth.uid() = user_id);

-- Reviews: Authenticated users can post, anyone can read
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post reviews" ON reviews 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
