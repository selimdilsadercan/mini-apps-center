-- HobbyCenter RPC Functions
-- 1. get_user_hobbies(clerk_id_param TEXT)
-- 2. update_user_hobby(clerk_id_param TEXT, hobby_id_param TEXT, status_param TEXT, notes_param TEXT, completed_steps_param JSONB)

-- 1. get_user_hobbies
DROP FUNCTION IF EXISTS hobby_center.get_user_hobbies(TEXT);
CREATE OR REPLACE FUNCTION hobby_center.get_user_hobbies(clerk_id_param TEXT)
RETURNS SETOF hobby_center.user_hobbies AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY
    SELECT * FROM hobby_center.user_hobbies
    WHERE user_id = v_user_id
    ORDER BY updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. update_user_hobby
DROP FUNCTION IF EXISTS hobby_center.update_user_hobby(TEXT, TEXT, TEXT, TEXT, JSONB);
CREATE OR REPLACE FUNCTION hobby_center.update_user_hobby(
    clerk_id_param TEXT,
    hobby_id_param TEXT,
    status_param TEXT,
    notes_param TEXT,
    completed_steps_param JSONB
)
RETURNS hobby_center.user_hobbies AS $$
DECLARE
    v_user_id UUID;
    v_result hobby_center.user_hobbies;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    INSERT INTO hobby_center.user_hobbies (
        user_id,
        hobby_id,
        status,
        notes,
        completed_steps,
        updated_at
    )
    VALUES (
        v_user_id,
        hobby_id_param,
        status_param,
        notes_param,
        completed_steps_param,
        NOW()
    )
    ON CONFLICT (user_id, hobby_id) DO UPDATE
    SET
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        completed_steps = EXCLUDED.completed_steps,
        updated_at = NOW()
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
