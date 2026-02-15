-- Migration script for Database Normalization

-- 1. Fix Categories/Products linking
-- Add temporary UUID column to products to store category_id reference properly
ALTER TABLE products ADD COLUMN category_uuid UUID;

-- Update the new column with casted current values
UPDATE products SET category_uuid = category_id::UUID WHERE category_id IS NOT NULL;

-- Drop old FK and column, add new FK and column
ALTER TABLE products DROP COLUMN category_id;
ALTER TABLE products RENAME COLUMN category_uuid TO category_id;
ALTER TABLE products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- 2. Create product_images table
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing images from products table
INSERT INTO product_images (product_id, url, position)
SELECT id, main_image, 0 FROM products WHERE main_image IS NOT NULL;

INSERT INTO product_images (product_id, url, position)
SELECT id, image1, 1 FROM products WHERE image1 IS NOT NULL;

INSERT INTO product_images (product_id, url, position)
SELECT id, image2, 2 FROM products WHERE image2 IS NOT NULL;

INSERT INTO product_images (product_id, url, position)
SELECT id, image3, 3 FROM products WHERE image3 IS NOT NULL;

-- Drop old image columns from products
ALTER TABLE products DROP COLUMN main_image;
ALTER TABLE products DROP COLUMN image1;
ALTER TABLE products DROP COLUMN image2;
ALTER TABLE products DROP COLUMN image3;

-- 3. Create product_variants table
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

-- Migrate existing size_variants and stock
-- This is tricky because size_variants is often stored as JSONB or TEXT[] in different versions.
-- The error indicates it's currently JSONB.
INSERT INTO product_variants (product_id, size, stock)
SELECT 
    id, 
    s.size, 
    CASE 
        WHEN jsonb_array_length(size_variants::jsonb) > 0 THEN stock / jsonb_array_length(size_variants::jsonb)
        ELSE stock 
    END
FROM products, jsonb_array_elements_text(size_variants::jsonb) AS s(size)
WHERE size_variants IS NOT NULL AND jsonb_array_length(size_variants::jsonb) > 0;

INSERT INTO product_variants (product_id, size, stock)
SELECT id, 'One Size', stock 
FROM products 
WHERE size_variants IS NULL OR jsonb_array_length(size_variants::jsonb) = 0;

-- Drop old columns from products
ALTER TABLE products DROP COLUMN size_variants;
ALTER TABLE products DROP COLUMN stock;

-- 4. Create order_items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_purchase NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate items from orders (JSONB migration)
-- This depends on the format of orders.items.
-- Assuming items is an array of {id, quantity, price, size}
-- This part might be better handled manually or with a script if data exists.
-- For now, let's keep the items column in orders for historical data but use order_items for new ones.

-- 5. Enable RLS for new tables
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access" ON product_images FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Users can read own order items" ON order_items 
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND auth.uid()::text = orders.user_id
    ));
