-- FUNCTIONS
-- 1. store.get_store_by_user_id
-- 2. store.get_store_by_id
-- 3. store.create_store
-- 4. store.update_store
-- 5. store.get_store_products
-- 6. store.get_all_products
-- 7. store.create_product
-- 8. store.update_product
-- 9. store.delete_product

-- 1. Get Store by User ID
DROP FUNCTION IF EXISTS store.get_store_by_user_id(TEXT);
CREATE OR REPLACE FUNCTION store.get_store_by_user_id(p_user_id TEXT)
RETURNS SETOF store.stores AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT * FROM store.stores
    WHERE created_user_id = v_user_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Store by ID
DROP FUNCTION IF EXISTS store.get_store_by_id(UUID);
CREATE OR REPLACE FUNCTION store.get_store_by_id(p_store_id UUID)
RETURNS SETOF store.stores AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM store.stores
    WHERE id = p_store_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Store
DROP FUNCTION IF EXISTS store.create_store(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION store.create_store(
    p_user_id TEXT,
    p_name TEXT,
    p_description TEXT,
    p_logo_url TEXT,
    p_banner_url TEXT,
    p_contact_whatsapp TEXT,
    p_contact_instagram TEXT,
    p_contact_email TEXT
)
RETURNS store.stores AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_result store.stores;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    INSERT INTO store.stores (
        created_user_id,
        name,
        description,
        logo_url,
        banner_url,
        contact_whatsapp,
        contact_instagram,
        contact_email
    ) VALUES (
        v_user_id,
        p_name,
        p_description,
        p_logo_url,
        p_banner_url,
        p_contact_whatsapp,
        p_contact_instagram,
        p_contact_email
    ) RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update Store
DROP FUNCTION IF EXISTS store.update_store(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION store.update_store(
    p_user_id TEXT,
    p_store_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_logo_url TEXT,
    p_banner_url TEXT,
    p_contact_whatsapp TEXT,
    p_contact_instagram TEXT,
    p_contact_email TEXT
)
RETURNS store.stores AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_result store.stores;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    UPDATE store.stores
    SET
        name = p_name,
        description = p_description,
        logo_url = p_logo_url,
        banner_url = p_banner_url,
        contact_whatsapp = p_contact_whatsapp,
        contact_instagram = p_contact_instagram,
        contact_email = p_contact_email
    WHERE id = p_store_id AND created_user_id = v_user_id
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Get Store Products
DROP FUNCTION IF EXISTS store.get_store_products(UUID);
CREATE OR REPLACE FUNCTION store.get_store_products(p_store_id UUID)
RETURNS SETOF store.products AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM store.products
    WHERE store_id = p_store_id
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Get All Products (Marketplace/Feed)
DROP FUNCTION IF EXISTS store.get_all_products(TEXT);
CREATE OR REPLACE FUNCTION store.get_all_products(p_category TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    store_id UUID,
    store_name TEXT,
    store_logo_url TEXT,
    name TEXT,
    description TEXT,
    price NUMERIC,
    currency TEXT,
    image_urls JSONB,
    category TEXT,
    is_available BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.store_id,
        s.name AS store_name,
        s.logo_url AS store_logo_url,
        p.name,
        p.description,
        p.price,
        p.currency,
        p.image_urls,
        p.category,
        p.is_available,
        p.created_at
    FROM store.products p
    JOIN store.stores s ON p.store_id = s.id
    WHERE p.is_available = true
      AND (p_category IS NULL OR p_category = '' OR p.category = p_category)
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create Product
DROP FUNCTION IF EXISTS store.create_product(TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, JSONB, TEXT);
CREATE OR REPLACE FUNCTION store.create_product(
    p_user_id TEXT,
    p_store_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_price NUMERIC,
    p_currency TEXT,
    p_image_urls JSONB,
    p_category TEXT
)
RETURNS store.products AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_result store.products;
    v_store_owner UUID;
BEGIN
    -- Verify store ownership
    SELECT created_user_id INTO v_store_owner FROM store.stores WHERE id = p_store_id;
    IF v_store_owner IS NULL OR v_store_owner <> v_user_id THEN
        RAISE EXCEPTION 'Unauthorized to manage this store';
    END IF;

    INSERT INTO store.products (
        store_id,
        name,
        description,
        price,
        currency,
        image_urls,
        category,
        is_available
    ) VALUES (
        p_store_id,
        p_name,
        p_description,
        p_price,
        p_currency,
        p_image_urls,
        p_category,
        true
    ) RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update Product
DROP FUNCTION IF EXISTS store.update_product(TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, JSONB, TEXT, BOOLEAN);
CREATE OR REPLACE FUNCTION store.update_product(
    p_user_id TEXT,
    p_product_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_price NUMERIC,
    p_currency TEXT,
    p_image_urls JSONB,
    p_category TEXT,
    p_is_available BOOLEAN
)
RETURNS store.products AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_result store.products;
    v_store_owner UUID;
    v_store_id UUID;
BEGIN
    -- Get product store ID
    SELECT store_id INTO v_store_id FROM store.products WHERE id = p_product_id;
    IF v_store_id IS NULL THEN
        RAISE EXCEPTION 'Product not found';
    END IF;

    -- Verify store ownership
    SELECT created_user_id INTO v_store_owner FROM store.stores WHERE id = v_store_id;
    IF v_store_owner IS NULL OR v_store_owner <> v_user_id THEN
        RAISE EXCEPTION 'Unauthorized to manage this store';
    END IF;

    UPDATE store.products
    SET
        name = p_name,
        description = p_description,
        price = p_price,
        currency = p_currency,
        image_urls = p_image_urls,
        category = p_category,
        is_available = p_is_available
    WHERE id = p_product_id
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Delete Product
DROP FUNCTION IF EXISTS store.delete_product(TEXT, UUID);
CREATE OR REPLACE FUNCTION store.delete_product(
    p_user_id TEXT,
    p_product_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_store_owner UUID;
    v_store_id UUID;
    deleted_count INTEGER;
BEGIN
    -- Get product store ID
    SELECT store_id INTO v_store_id FROM store.products WHERE id = p_product_id;
    IF v_store_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Verify store ownership
    SELECT created_user_id INTO v_store_owner FROM store.stores WHERE id = v_store_id;
    IF v_store_owner IS NULL OR v_store_owner <> v_user_id THEN
        RAISE EXCEPTION 'Unauthorized to manage this store';
    END IF;

    DELETE FROM store.products
    WHERE id = p_product_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
