-- FUNCTIONS
-- 1. digital_menu.get_menu_data
-- 2. digital_menu.add_category
-- 3. digital_menu.add_menu_item
-- 4. digital_menu.toggle_item_availability
-- 5. digital_menu.call_waiter
-- 6. digital_menu.get_waiter_calls
-- 7. digital_menu.resolve_waiter_call
-- 8. digital_menu.get_user_favorites
-- 9. digital_menu.toggle_favorite

-- 1. Get menu data
DROP FUNCTION IF EXISTS digital_menu.get_menu_data(UUID);
CREATE OR REPLACE FUNCTION digital_menu.get_menu_data(p_business_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_categories JSONB;
    v_items JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'order_index', c.order_index
    ) ORDER BY c.order_index ASC, c.created_at ASC), '[]'::jsonb)
    INTO v_categories
    FROM digital_menu.categories c
    WHERE c.business_id = p_business_id;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', i.id,
        'category_id', i.category_id,
        'name', i.name,
        'description', i.description,
        'price', i.price,
        'image_url', i.image_url,
        'is_available', i.is_available,
        'dietary_flags', i.dietary_flags,
        'order_index', i.order_index
    ) ORDER BY i.order_index ASC, i.created_at ASC), '[]'::jsonb)
    INTO v_items
    FROM digital_menu.items i
    WHERE i.category_id IN (SELECT c.id FROM digital_menu.categories c WHERE c.business_id = p_business_id);

    RETURN jsonb_build_object(
        'categories', v_categories,
        'items', v_items
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add Category
DROP FUNCTION IF EXISTS digital_menu.add_category(UUID, TEXT);
CREATE OR REPLACE FUNCTION digital_menu.add_category(
    p_business_id UUID,
    p_name TEXT
)
RETURNS digital_menu.categories AS $$
DECLARE
    v_result digital_menu.categories;
    v_max_order INTEGER;
BEGIN
    SELECT COALESCE(MAX(order_index), 0) INTO v_max_order
    FROM digital_menu.categories
    WHERE business_id = p_business_id;

    INSERT INTO digital_menu.categories (
        business_id,
        name,
        order_index
    ) VALUES (
        p_business_id,
        p_name,
        v_max_order + 1
    ) RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add Menu Item
DROP FUNCTION IF EXISTS digital_menu.add_menu_item(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT[]);
CREATE OR REPLACE FUNCTION digital_menu.add_menu_item(
    p_category_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_price NUMERIC,
    p_image_url TEXT,
    p_dietary_flags TEXT[]
)
RETURNS digital_menu.items AS $$
DECLARE
    v_result digital_menu.items;
    v_max_order INTEGER;
BEGIN
    SELECT COALESCE(MAX(order_index), 0) INTO v_max_order
    FROM digital_menu.items
    WHERE category_id = p_category_id;

    INSERT INTO digital_menu.items (
        category_id,
        name,
        description,
        price,
        image_url,
        dietary_flags,
        order_index
    ) VALUES (
        p_category_id,
        p_name,
        p_description,
        p_price,
        p_image_url,
        p_dietary_flags,
        v_max_order + 1
    ) RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Toggle Item Availability
DROP FUNCTION IF EXISTS digital_menu.toggle_item_availability(UUID);
CREATE OR REPLACE FUNCTION digital_menu.toggle_item_availability(p_item_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_avail BOOLEAN;
BEGIN
    UPDATE digital_menu.items
    SET is_available = NOT is_available
    WHERE id = p_item_id
    RETURNING is_available INTO v_avail;

    RETURN v_avail;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Call Waiter
DROP FUNCTION IF EXISTS digital_menu.call_waiter(UUID, TEXT);
CREATE OR REPLACE FUNCTION digital_menu.call_waiter(
    p_business_id UUID,
    p_table_number TEXT
)
RETURNS digital_menu.waiter_calls AS $$
DECLARE
    v_result digital_menu.waiter_calls;
BEGIN
    INSERT INTO digital_menu.waiter_calls (
        business_id,
        table_number,
        status
    ) VALUES (
        p_business_id,
        p_table_number,
        'pending'
    ) RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Get Waiter Calls
DROP FUNCTION IF EXISTS digital_menu.get_waiter_calls(UUID);
CREATE OR REPLACE FUNCTION digital_menu.get_waiter_calls(p_business_id UUID)
RETURNS TABLE (
    id UUID,
    table_number TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT wc.id, wc.table_number, wc.status, wc.created_at
    FROM digital_menu.waiter_calls wc
    WHERE wc.business_id = p_business_id AND wc.status = 'pending'
    ORDER BY wc.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Resolve Waiter Call
DROP FUNCTION IF EXISTS digital_menu.resolve_waiter_call(UUID);
CREATE OR REPLACE FUNCTION digital_menu.resolve_waiter_call(p_call_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    UPDATE digital_menu.waiter_calls
    SET status = 'resolved'
    WHERE id = p_call_id AND status = 'pending';

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Get User Favorites
DROP FUNCTION IF EXISTS digital_menu.get_user_favorites(TEXT);
CREATE OR REPLACE FUNCTION digital_menu.get_user_favorites(p_user_id TEXT)
RETURNS TABLE (
    business_id UUID
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT uf.business_id
    FROM digital_menu.user_favorites uf
    WHERE uf.user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Toggle Favorite
DROP FUNCTION IF EXISTS digital_menu.toggle_favorite(TEXT, UUID);
CREATE OR REPLACE FUNCTION digital_menu.toggle_favorite(
    p_user_id TEXT,
    p_business_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM digital_menu.user_favorites
        WHERE user_id = v_user_id AND business_id = p_business_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM digital_menu.user_favorites
        WHERE user_id = v_user_id AND business_id = p_business_id;
        RETURN FALSE;
    ELSE
        INSERT INTO digital_menu.user_favorites (user_id, business_id)
        VALUES (v_user_id, p_business_id);
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
