-- 1. tus_tercih.get_saved_choices(p_user_id TEXT)
-- 2. tus_tercih.add_saved_choice(p_user_id TEXT, p_placement_id TEXT, p_note TEXT)
-- 3. tus_tercih.remove_saved_choice(p_user_id TEXT, p_placement_id TEXT)
-- 4. tus_tercih.reorder_saved_choices(p_user_id TEXT, p_placement_ids TEXT[])

DROP FUNCTION IF EXISTS tus_tercih.get_saved_choices(TEXT);

CREATE OR REPLACE FUNCTION tus_tercih.get_saved_choices(
    p_user_id TEXT
)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    placement_id TEXT,
    sort_order INT,
    note TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.user_id,
        sc.placement_id,
        sc.sort_order,
        sc.note,
        sc.created_at
    FROM tus_tercih.saved_choices sc
    WHERE sc.user_id = p_user_id
    ORDER BY sc.sort_order ASC, sc.created_at ASC;
END;
$$;

DROP FUNCTION IF EXISTS tus_tercih.add_saved_choice(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION tus_tercih.add_saved_choice(
    p_user_id TEXT,
    p_placement_id TEXT,
    p_note TEXT DEFAULT ''
)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    placement_id TEXT,
    sort_order INT,
    note TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_max_sort INT;
    v_inserted_id UUID;
BEGIN
    SELECT COALESCE(MAX(sc.sort_order), 0) + 1 
    INTO v_max_sort 
    FROM tus_tercih.saved_choices sc 
    WHERE sc.user_id = p_user_id;

    INSERT INTO tus_tercih.saved_choices (user_id, placement_id, sort_order, note)
    VALUES (p_user_id, p_placement_id, v_max_sort, COALESCE(p_note, ''))
    ON CONFLICT (user_id, placement_id) 
    DO UPDATE SET 
        note = COALESCE(EXCLUDED.note, tus_tercih.saved_choices.note)
    RETURNING tus_tercih.saved_choices.id INTO v_inserted_id;

    RETURN QUERY
    SELECT 
        sc.id,
        sc.user_id,
        sc.placement_id,
        sc.sort_order,
        sc.note,
        sc.created_at
    FROM tus_tercih.saved_choices sc
    WHERE sc.id = v_inserted_id;
END;
$$;

DROP FUNCTION IF EXISTS tus_tercih.remove_saved_choice(TEXT, TEXT);

CREATE OR REPLACE FUNCTION tus_tercih.remove_saved_choice(
    p_user_id TEXT,
    p_placement_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM tus_tercih.saved_choices
    WHERE user_id = p_user_id AND placement_id = p_placement_id;

    RETURN FOUND;
END;
$$;

DROP FUNCTION IF EXISTS tus_tercih.reorder_saved_choices(TEXT, TEXT[]);

CREATE OR REPLACE FUNCTION tus_tercih.reorder_saved_choices(
    p_user_id TEXT,
    p_placement_ids TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(p_placement_ids, 1) LOOP
        UPDATE tus_tercih.saved_choices
        SET sort_order = i
        WHERE user_id = p_user_id AND placement_id = p_placement_ids[i];
    END LOOP;

    RETURN TRUE;
END;
$$;

GRANT ALL ON ALL FUNCTIONS IN SCHEMA tus_tercih TO anon, authenticated, service_role;
