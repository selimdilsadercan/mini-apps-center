-- FUNCTIONS
-- 1. map_tracker.get_data
-- 2. map_tracker.import_items
-- 3. map_tracker.toggle_visited

-- 1. Get Data
DROP FUNCTION IF EXISTS map_tracker.get_data();
DROP FUNCTION IF EXISTS map_tracker.get_data(TEXT);
CREATE OR REPLACE FUNCTION map_tracker.get_data(clerk_id_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    result JSONB;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    SELECT jsonb_build_object(
        'lists', COALESCE((
            SELECT jsonb_agg(l.* ORDER BY l.created_at DESC) 
            FROM map_tracker.lists l 
            WHERE l.user_id = v_user_id
        ), '[]'::jsonb),
        'items', COALESCE((
            SELECT jsonb_agg(i.* ORDER BY i.created_at DESC) 
            FROM map_tracker.items i
            JOIN map_tracker.lists l ON i.list_id = l.id
            WHERE l.user_id = v_user_id
        ), '[]'::jsonb)
    ) INTO result;
    
    RETURN result;
END;
$$;

-- 2. Import Items
DROP FUNCTION IF EXISTS map_tracker.import_items(TEXT, JSONB);
DROP FUNCTION IF EXISTS map_tracker.import_items(TEXT, TEXT, JSONB);
CREATE OR REPLACE FUNCTION map_tracker.import_items(clerk_id_param TEXT, p_list_name TEXT, p_items JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_list_id UUID;
    v_item JSONB;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Listeyi oluştur veya mevcut olanın ID'sini al
    INSERT INTO map_tracker.lists (user_id, name)
    VALUES (v_user_id, p_list_name)
    ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_list_id;

    -- Mekanları döngüyle ekle/güncelle
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO map_tracker.items (
            list_id, 
            name, 
            address, 
            google_maps_url, 
            latitude, 
            longitude, 
            note, 
            metadata
        )
        VALUES (
            v_list_id,
            v_item->>'name',
            v_item->>'address',
            v_item->>'google_maps_url',
            (v_item->>'latitude')::DOUBLE PRECISION,
            (v_item->>'longitude')::DOUBLE PRECISION,
            v_item->>'note',
            COALESCE(v_item->'metadata', '{}'::jsonb)
        )
        ON CONFLICT (list_id, name) DO NOTHING; -- Aynı listede aynı isimli mekan varsa pas geç
    END LOOP;
END;
$$;

-- 3. Toggle Visited
DROP FUNCTION IF EXISTS map_tracker.toggle_visited(UUID);
DROP FUNCTION IF EXISTS map_tracker.toggle_visited(TEXT, UUID);
CREATE OR REPLACE FUNCTION map_tracker.toggle_visited(clerk_id_param TEXT, p_item_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    UPDATE map_tracker.items i
    SET is_visited = NOT is_visited
    FROM map_tracker.lists l
    WHERE i.id = p_item_id AND i.list_id = l.id AND l.user_id = v_user_id;
END;
$$;
