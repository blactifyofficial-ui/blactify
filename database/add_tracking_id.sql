-- Add tracking_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
