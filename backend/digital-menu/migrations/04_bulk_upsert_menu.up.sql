-- Bulk upsert menu items and categories
CREATE OR REPLACE FUNCTION digital_menu.bulk_upsert_menu(
    p_business_id TEXT,
    p_items JSONB
)
RETURNS INTEGER AS $$
DECLARE
    v_item JSONB;
    v_category_name TEXT;
    v_category_image TEXT;
    v_category_id UUID;
    v_item_name TEXT;
    v_item_desc TEXT;
    v_item_price NUMERIC;
    v_item_image TEXT;
    v_item_flags TEXT[];
    v_imported_count INTEGER := 0;
    v_max_order INTEGER;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_category_name := v_item->>'category';
        v_category_image := v_item->>'categoryImageUrl';
        v_item_name := v_item->>'name';
        v_item_desc := v_item->>'description';
        v_item_price := (v_item->>'price')::NUMERIC;
        v_item_image := v_item->>'imageUrl';
        v_item_flags := ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_item->'dietaryFlags', '[]'::jsonb)));

        -- 1. Handle Category
        SELECT id INTO v_category_id 
        FROM digital_menu.categories 
        WHERE business_id = p_business_id AND name = v_category_name;

        IF v_category_id IS NULL THEN
            SELECT COALESCE(MAX(order_index), 0) INTO v_max_order
            FROM digital_menu.categories
            WHERE business_id = p_business_id;

            INSERT INTO digital_menu.categories (business_id, name, image_url, order_index)
            VALUES (p_business_id, v_category_name, v_category_image, v_max_order + 1)
            RETURNING id INTO v_category_id;
        ELSE
            -- Update existing category image if provided
            IF v_category_image IS NOT NULL AND v_category_image <> '' THEN
                UPDATE digital_menu.categories
                SET image_url = v_category_image
                WHERE id = v_category_id;
            END IF;
        END IF;

        -- 2. Upsert Item
        IF EXISTS (SELECT 1 FROM digital_menu.items WHERE category_id = v_category_id AND name = v_item_name) THEN
            UPDATE digital_menu.items
            SET description = v_item_desc,
                price = v_item_price,
                image_url = v_item_image,
                dietary_flags = v_item_flags
            WHERE category_id = v_category_id AND name = v_item_name;
        ELSE
            SELECT COALESCE(MAX(order_index), 0) INTO v_max_order
            FROM digital_menu.items
            WHERE category_id = v_category_id;

            INSERT INTO digital_menu.items (category_id, name, description, price, image_url, dietary_flags, order_index)
            VALUES (v_category_id, v_item_name, v_item_desc, v_item_price, v_item_image, v_item_flags, v_max_order + 1);
        END IF;

        v_imported_count := v_imported_count + 1;
    END LOOP;

    RETURN v_imported_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION digital_menu.bulk_upsert_menu(TEXT, JSONB) TO anon, authenticated, service_role;
