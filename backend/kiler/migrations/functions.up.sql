-- FUNCTIONS
-- 1. kiler.get_items
-- 2. kiler.add_item
-- 3. kiler.delete_item

-- 1. Get Items
DROP FUNCTION IF EXISTS kiler.get_items(TEXT);
CREATE OR REPLACE FUNCTION kiler.get_items(clerk_id_param TEXT)
RETURNS SETOF kiler.items AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY
    SELECT * FROM kiler.items
    WHERE user_id = v_user_id
    ORDER BY expiry_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add Item
DROP FUNCTION IF EXISTS kiler.add_item(TEXT, TEXT, DECIMAL, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);
CREATE OR REPLACE FUNCTION kiler.add_item(
    clerk_id_param TEXT,
    name_param TEXT,
    amount_param DECIMAL,
    unit_param TEXT,
    storage_type_param TEXT,
    purchase_date_param TIMESTAMPTZ,
    expiry_date_param TIMESTAMPTZ DEFAULT NULL
)
RETURNS kiler.items AS $$
DECLARE
    v_user_id UUID;
    v_new_item kiler.items;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    INSERT INTO kiler.items (
        user_id, name, amount, unit, storage_type, purchase_date, expiry_date
    ) VALUES (
        v_user_id, name_param, amount_param, unit_param, storage_type_param, purchase_date_param, expiry_date_param
    ) RETURNING * INTO v_new_item;
    
    RETURN v_new_item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Delete Item
DROP FUNCTION IF EXISTS kiler.delete_item(UUID, TEXT);
CREATE OR REPLACE FUNCTION kiler.delete_item(
    item_id_param UUID,
    clerk_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    deleted_count INTEGER;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    DELETE FROM kiler.items
    WHERE id = item_id_param AND user_id = v_user_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
