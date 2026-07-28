-- FUNCTIONS
-- 1. yks_tercih.get_saved_choices(p_user_id TEXT)
-- 2. yks_tercih.add_saved_choice(p_user_id TEXT, p_program_id TEXT, p_note TEXT)
-- 3. yks_tercih.remove_saved_choice(p_user_id TEXT, p_program_id TEXT)
-- 4. yks_tercih.reorder_saved_choices(p_user_id TEXT, p_program_ids TEXT[])

-- ============================================================================
-- 1. yks_tercih.get_saved_choices
-- ============================================================================
DROP FUNCTION IF EXISTS yks_tercih.get_saved_choices(TEXT);

CREATE OR REPLACE FUNCTION yks_tercih.get_saved_choices(
    p_user_id TEXT
)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    program_id TEXT,
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
        sc.program_id,
        sc.sort_order,
        sc.note,
        sc.created_at
    FROM yks_tercih.saved_choices sc
    WHERE sc.user_id = p_user_id
    ORDER BY sc.sort_order ASC, sc.created_at ASC;
END;
$$;

-- ============================================================================
-- 2. yks_tercih.add_saved_choice
-- ============================================================================
DROP FUNCTION IF EXISTS yks_tercih.add_saved_choice(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION yks_tercih.add_saved_choice(
    p_user_id TEXT,
    p_program_id TEXT,
    p_note TEXT DEFAULT ''
)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    program_id TEXT,
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
    FROM yks_tercih.saved_choices sc 
    WHERE sc.user_id = p_user_id;

    INSERT INTO yks_tercih.saved_choices (user_id, program_id, sort_order, note)
    VALUES (p_user_id, p_program_id, v_max_sort, COALESCE(p_note, ''))
    ON CONFLICT (user_id, program_id) 
    DO UPDATE SET 
        note = COALESCE(EXCLUDED.note, yks_tercih.saved_choices.note)
    RETURNING yks_tercih.saved_choices.id INTO v_inserted_id;

    RETURN QUERY
    SELECT 
        sc.id,
        sc.user_id,
        sc.program_id,
        sc.sort_order,
        sc.note,
        sc.created_at
    FROM yks_tercih.saved_choices sc
    WHERE sc.id = v_inserted_id;
END;
$$;

-- ============================================================================
-- 3. yks_tercih.remove_saved_choice
-- ============================================================================
DROP FUNCTION IF EXISTS yks_tercih.remove_saved_choice(TEXT, TEXT);

CREATE OR REPLACE FUNCTION yks_tercih.remove_saved_choice(
    p_user_id TEXT,
    p_program_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM yks_tercih.saved_choices
    WHERE user_id = p_user_id AND program_id = p_program_id;

    RETURN FOUND;
END;
$$;

-- ============================================================================
-- 4. yks_tercih.reorder_saved_choices
-- ============================================================================
DROP FUNCTION IF EXISTS yks_tercih.reorder_saved_choices(TEXT, TEXT[]);

CREATE OR REPLACE FUNCTION yks_tercih.reorder_saved_choices(
    p_user_id TEXT,
    p_program_ids TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..array_length(p_program_ids, 1) LOOP
        UPDATE yks_tercih.saved_choices
        SET sort_order = i
        WHERE user_id = p_user_id AND program_id = p_program_ids[i];
    END LOOP;

    RETURN TRUE;
END;
$$;

GRANT ALL ON ALL FUNCTIONS IN SCHEMA yks_tercih TO anon, authenticated, service_role;
