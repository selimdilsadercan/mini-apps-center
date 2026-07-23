-- FUNCTIONS
-- 1. siparis_takip.get_summary
-- 2. siparis_takip.get_customers
-- 3. siparis_takip.upsert_customer
-- 4. siparis_takip.get_orders
-- 5. siparis_takip.upsert_order
-- 6. siparis_takip.delete_order
-- 7. siparis_takip.delete_customer

-- 1. Get Summary
DROP FUNCTION IF EXISTS siparis_takip.get_summary(TEXT);
CREATE OR REPLACE FUNCTION siparis_takip.get_summary(p_user_id TEXT)
RETURNS TABLE (
    total_orders BIGINT,
    active_orders BIGINT,
    total_earnings NUMERIC(10,2),
    pending_payments NUMERIC(10,2)
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT
        COUNT(id) AS total_orders,
        COUNT(id) FILTER (WHERE status IN ('received', 'in_progress', 'ready')) AS active_orders,
        COALESCE(SUM(paid_amount), 0.00) AS total_earnings,
        COALESCE(SUM(price - paid_amount) FILTER (WHERE status <> 'cancelled'), 0.00) AS pending_payments
    FROM siparis_takip.orders
    WHERE created_user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Customers
DROP FUNCTION IF EXISTS siparis_takip.get_customers(TEXT);
CREATE OR REPLACE FUNCTION siparis_takip.get_customers(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    phone TEXT,
    instagram_username TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ,
    order_count BIGINT
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.name,
        c.phone,
        c.instagram_username,
        c.address,
        c.notes,
        c.created_at,
        COUNT(o.id) AS order_count
    FROM siparis_takip.customers c
    LEFT JOIN siparis_takip.orders o ON o.customer_id = c.id
    WHERE c.created_user_id = v_user_id
    GROUP BY c.id
    ORDER BY c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Upsert Customer
DROP FUNCTION IF EXISTS siparis_takip.upsert_customer(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION siparis_takip.upsert_customer(
    p_id UUID,
    p_user_id TEXT,
    p_name TEXT,
    p_phone TEXT,
    p_instagram_username TEXT,
    p_address TEXT,
    p_notes TEXT
)
RETURNS siparis_takip.customers AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_result siparis_takip.customers;
    v_id UUID := p_id;
BEGIN
    IF v_id IS NULL THEN
        v_id := gen_random_uuid();
    END IF;

    INSERT INTO siparis_takip.customers (
        id,
        created_user_id,
        name,
        phone,
        instagram_username,
        address,
        notes
    ) VALUES (
        v_id,
        v_user_id,
        p_name,
        p_phone,
        p_instagram_username,
        p_address,
        p_notes
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        instagram_username = EXCLUDED.instagram_username,
        address = EXCLUDED.address,
        notes = EXCLUDED.notes
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get Orders
DROP FUNCTION IF EXISTS siparis_takip.get_orders(TEXT, TEXT);
CREATE OR REPLACE FUNCTION siparis_takip.get_orders(p_user_id TEXT, p_status TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    customer_id UUID,
    customer_name TEXT,
    customer_instagram TEXT,
    customer_phone TEXT,
    title TEXT,
    price NUMERIC(10,2),
    paid_amount NUMERIC(10,2),
    status TEXT,
    order_date DATE,
    deadline DATE,
    materials_notes TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.customer_id,
        c.name AS customer_name,
        c.instagram_username AS customer_instagram,
        c.phone AS customer_phone,
        o.title,
        o.price,
        o.paid_amount,
        o.status,
        o.order_date,
        o.deadline,
        o.materials_notes,
        o.notes,
        o.created_at
    FROM siparis_takip.orders o
    JOIN siparis_takip.customers c ON o.customer_id = c.id
    WHERE o.created_user_id = v_user_id
      AND (p_status IS NULL OR o.status = p_status)
    ORDER BY o.deadline ASC NULLS LAST, o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Upsert Order
DROP FUNCTION IF EXISTS siparis_takip.upsert_order(UUID, TEXT, UUID, TEXT, NUMERIC, NUMERIC, TEXT, DATE, DATE, TEXT, TEXT);
CREATE OR REPLACE FUNCTION siparis_takip.upsert_order(
    p_id UUID,
    p_user_id TEXT,
    p_customer_id UUID,
    p_title TEXT,
    p_price NUMERIC,
    p_paid_amount NUMERIC,
    p_status TEXT,
    p_order_date DATE,
    p_deadline DATE,
    p_materials_notes TEXT,
    p_notes TEXT
)
RETURNS SETOF siparis_takip.orders AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_id UUID := p_id;
BEGIN
    IF v_id IS NULL THEN
        v_id := gen_random_uuid();
    END IF;

    RETURN QUERY
    INSERT INTO siparis_takip.orders (
        id,
        created_user_id,
        customer_id,
        title,
        price,
        paid_amount,
        status,
        order_date,
        deadline,
        materials_notes,
        notes
    ) VALUES (
        v_id,
        v_user_id,
        p_customer_id,
        p_title,
        p_price,
        p_paid_amount,
        p_status,
        p_order_date,
        p_deadline,
        p_materials_notes,
        p_notes
    )
    ON CONFLICT (id) DO UPDATE SET
        customer_id = EXCLUDED.customer_id,
        title = EXCLUDED.title,
        price = EXCLUDED.price,
        paid_amount = EXCLUDED.paid_amount,
        status = EXCLUDED.status,
        order_date = EXCLUDED.order_date,
        deadline = EXCLUDED.deadline,
        materials_notes = EXCLUDED.materials_notes,
        notes = EXCLUDED.notes
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Delete Order
DROP FUNCTION IF EXISTS siparis_takip.delete_order(UUID, TEXT);
CREATE OR REPLACE FUNCTION siparis_takip.delete_order(p_id UUID, p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM siparis_takip.orders
    WHERE id = p_id AND created_user_id = v_user_id;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Delete Customer
DROP FUNCTION IF EXISTS siparis_takip.delete_customer(UUID, TEXT);
CREATE OR REPLACE FUNCTION siparis_takip.delete_customer(p_id UUID, p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_deleted_count INTEGER;
BEGIN
    -- NOTE: ON DELETE RESTRICT on orders table prevents deletion of customers with orders.
    DELETE FROM siparis_takip.customers
    WHERE id = p_id AND created_user_id = v_user_id;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
