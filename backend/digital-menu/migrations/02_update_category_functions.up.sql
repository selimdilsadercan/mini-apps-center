-- Update get_menu_data to include category image_url
CREATE OR REPLACE FUNCTION digital_menu.get_menu_data(p_business_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_categories JSONB;
    v_items JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'image_url', c.image_url,
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

-- Update add_category to include image_url
DROP FUNCTION IF EXISTS digital_menu.add_category(TEXT, TEXT);
CREATE OR REPLACE FUNCTION digital_menu.add_category(
    p_business_id TEXT,
    p_name TEXT,
    p_image_url TEXT DEFAULT NULL
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
        image_url,
        order_index
    ) VALUES (
        p_business_id,
        p_name,
        p_image_url,
        v_max_order + 1
    ) RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
