DROP FUNCTION IF EXISTS rutinler.clear_postpone(UUID, TEXT);
CREATE OR REPLACE FUNCTION rutinler.clear_postpone(
    entry_id_param UUID,
    clerk_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    UPDATE rutinler.entries
    SET postponed_until = NULL
    WHERE id = entry_id_param AND user_id = v_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
