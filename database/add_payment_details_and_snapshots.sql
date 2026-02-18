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
