-- FUNCTIONS
-- 1. eksik_var.get_missing_items
-- 2. eksik_var.add_missing_item
-- 3. eksik_var.delete_missing_item

-- 1. Get Missing Items
DROP FUNCTION IF EXISTS eksik_var.get_missing_items(TEXT);
CREATE OR REPLACE FUNCTION eksik_var.get_missing_items(clerk_id_param TEXT)
RETURNS SETOF eksik_var.missing_items AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY
    SELECT * FROM eksik_var.missing_items
    WHERE user_id = v_user_id
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add Missing Item
DROP FUNCTION IF EXISTS eksik_var.add_missing_item(TEXT, TEXT);
CREATE OR REPLACE FUNCTION eksik_var.add_missing_item(
    clerk_id_param TEXT,
    name_param TEXT
)
RETURNS eksik_var.missing_items AS $$
DECLARE
    v_user_id UUID;
    v_new_item eksik_var.missing_items;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    INSERT INTO eksik_var.missing_items (
        user_id, name
    ) VALUES (
        v_user_id, name_param
    ) RETURNING * INTO v_new_item;
    
    RETURN v_new_item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Delete Missing Item
DROP FUNCTION IF EXISTS eksik_var.delete_missing_item(UUID, TEXT);
CREATE OR REPLACE FUNCTION eksik_var.delete_missing_item(
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

    DELETE FROM eksik_var.missing_items
    WHERE id = item_id_param AND user_id = v_user_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
