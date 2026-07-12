-- 1. Add notes column to missing_items table
ALTER TABLE eksik_var.missing_items ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Update Add Missing Item Function
DROP FUNCTION IF EXISTS eksik_var.add_missing_item(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION eksik_var.add_missing_item(
    clerk_id_param TEXT,
    name_param TEXT,
    category_param TEXT DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
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
        user_id, name, category, notes
    ) VALUES (
        v_user_id, name_param, category_param, notes_param
    ) RETURNING * INTO v_new_item;
    
    RETURN v_new_item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Missing Item Function
DROP FUNCTION IF EXISTS eksik_var.update_missing_item(UUID, TEXT, TEXT, BOOLEAN, TEXT);
CREATE OR REPLACE FUNCTION eksik_var.update_missing_item(
    item_id_param UUID,
    clerk_id_param TEXT,
    name_param TEXT DEFAULT NULL,
    is_used_param BOOLEAN DEFAULT NULL,
    category_param TEXT DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
)
RETURNS eksik_var.missing_items AS $$
DECLARE
    v_user_id UUID;
    v_item eksik_var.missing_items;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    UPDATE eksik_var.missing_items
    SET
        name = COALESCE(name_param, name),
        is_used = COALESCE(is_used_param, is_used),
        category = COALESCE(category_param, category),
        notes = CASE WHEN notes_param IS NOT NULL THEN notes_param ELSE notes END
    WHERE id = item_id_param AND (
        user_id = v_user_id
        OR user_id IN (SELECT owner_id FROM eksik_var.shared_lists WHERE member_id = v_user_id)
        OR user_id IN (SELECT member_id FROM eksik_var.shared_lists WHERE owner_id = v_user_id)
    )
    RETURNING * INTO v_item;

    IF v_item IS NULL THEN
        RAISE EXCEPTION 'Item not found';
    END IF;

    RETURN v_item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
