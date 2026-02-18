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
