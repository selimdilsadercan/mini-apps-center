DROP FUNCTION IF EXISTS map_tracker.import_items(TEXT, JSONB);

CREATE OR REPLACE FUNCTION map_tracker.import_items(p_list_name TEXT, p_items JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_list_id UUID;
    v_item JSONB;
BEGIN
    -- Ensure the list exists
    INSERT INTO map_tracker.lists (name)
    VALUES (p_list_name)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_list_id;

    -- Insert or update items
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
        ON CONFLICT (list_id, name) DO NOTHING; -- Avoid duplicates in the same list
    END LOOP;
END;
$$;
