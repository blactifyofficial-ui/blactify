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
